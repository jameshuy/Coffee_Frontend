import { useEffect, RefObject } from 'react';

/**
 * A hook that ensures videos autoplay safely across mobile and desktop browsers.
 * Handles stricter autoplay policies on iOS Safari and other mobile browsers.
 * 
 * @param videoRef React ref to the video element
 * @param options Configuration options
 * @returns void
 */
export function useMobileSafeAutoplay(
  videoRef: RefObject<HTMLVideoElement>,
  options: {
    debug?: boolean;
    requiresInteraction?: boolean;
  } = {}
) {
  const { debug = false, requiresInteraction = false } = options;
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const log = (...args: any[]) => {
      if (debug) console.log(...args);
    };
    
    log(`Video readyState: ${video.readyState}`);
    
    // Function to attempt playing the video
    const attemptPlay = () => {
      if (!video) return;
      
      // Only try playing if the video has enough data
      if (video.readyState >= 2) {
        log('Attempting to play video...');
        
        video.play().then(() => {
          log('✅ Video playback started successfully');
        }).catch(error => {
          log('⚠️ Autoplay prevented by browser:', error);
          
          // Add interaction-based fallbacks
          if (!requiresInteraction) {
            log('Adding interaction listeners for playback');
            
            // Try on first touch (mobile)
            document.addEventListener('touchstart', playVideoOnce, { once: true });
            
            // Try on first click (universal)
            document.addEventListener('click', playVideoOnce, { once: true });
            
            // Try on scroll (iOS sometimes allows this)
            document.addEventListener('scroll', playVideoOnce, { once: true });
          }
        });
      } else {
        log(`Video not ready yet (readyState: ${video.readyState}), waiting...`);
        
        // Try again when more data is available
        video.addEventListener('loadeddata', attemptPlayOnce, { once: true });
      }
    };
    
    // Ensure each listener only fires once
    const attemptPlayOnce = () => {
      if (video.paused) {
        attemptPlay();
      }
    };
    
    // Handle play attempts on user interaction
    const playVideoOnce = () => {
      if (!video || !video.paused) return;
      
      log('👆 User interaction detected, trying playback again');
      
      video.play().then(() => {
        log('✅ Video playback started after user interaction');
      }).catch(err => {
        log('❌ Still unable to play video after interaction:', err);
      });
    };
    
    // Schedule initial playback attempt after render
    requestAnimationFrame(() => {
      log('Initial play attempt via requestAnimationFrame');
      attemptPlay();
    });
    
    // Backup attempt for tricky browsers
    setTimeout(() => {
      if (video.paused) {
        log('Timeout backup attempt');
        attemptPlay();
      }
    }, 1000);
    
    // If video loads after our initial attempts, try again
    video.addEventListener('canplay', attemptPlayOnce, { once: true });
    
    // Clean up all event listeners when component unmounts
    return () => {
      document.removeEventListener('touchstart', playVideoOnce);
      document.removeEventListener('click', playVideoOnce);
      document.removeEventListener('scroll', playVideoOnce);
      video.removeEventListener('canplay', attemptPlayOnce);
      video.removeEventListener('loadeddata', attemptPlayOnce);
    };
  }, [videoRef, debug, requiresInteraction]);
}