import { trackEvent } from '@/lib/analytics';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'wouter';

// Updated slideshow media - first item is Ferrari video, second is red pop art Ferrari
import { SLIDESHOW_MEDIA } from "@/lib/slideshowMedia";

export default function LandingPageContent() {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextSlide = useCallback(() => {
    setCurrentMediaIndex((prevIndex) =>
      prevIndex === SLIDESHOW_MEDIA.length - 1 ? 0 : prevIndex + 1
    );
  }, []);
  
  // Effect to cycle through media
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (SLIDESHOW_MEDIA[currentMediaIndex].type === 'video' && videoRef.current) {
      const video = videoRef.current;
      video.addEventListener('ended', nextSlide);
      video.play().catch(console.error);
      return () => {
        video.removeEventListener('ended', nextSlide);
      };
    }

    timeoutId = setTimeout(nextSlide, 1000);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentMediaIndex, nextSlide]);
  
  return (
    <div className="w-full mx-auto flex flex-col items-center">
      {/* Main tagline from Navigation is above this component */}
      
      {/* Media slideshow */}
      <div className="w-full flex justify-center mt-0 mb-8">
        <div className="w-[80%] sm:w-full max-w-[350px] relative" style={{ aspectRatio: '1/1.414' }}>
          <div className="w-full h-full overflow-hidden outline outline-[18px] outline-white">
            {SLIDESHOW_MEDIA[currentMediaIndex].type === 'video' ? (
              <video
                ref={videoRef}
                src={SLIDESHOW_MEDIA[currentMediaIndex].src}
                className="w-full h-full object-cover select-none pointer-events-none"
                style={{ backgroundColor: 'black', userSelect: 'none' }}
                muted
                playsInline
                onContextMenu={(e) => e.preventDefault()}
              />
            ) : (
              <img 
                src={SLIDESHOW_MEDIA[currentMediaIndex].src} 
                alt={`Poster example ${currentMediaIndex + 1}`}
                className="w-full h-full object-fill select-none pointer-events-none"
                style={{ backgroundColor: 'black', userSelect: 'none' }}
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
            
            {/* Overlay with semi-transparent gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
          </div>
        </div>
      </div>
      
      {/* Landing page text */}
      <div className="mb-6 flex flex-col items-center justify-center w-full">
        <p className="text-center text-gray-300 font-notosans text-sm sm:text-sm md:text-base lg:text-lg xl:text-xl whitespace-nowrap mb-1">
          Turn great moments into collectible posters.
        </p>
        <p className="text-center text-gray-300 font-notosans text-sm sm:text-sm md:text-base lg:text-lg xl:text-xl whitespace-nowrap">
          Get featured in one of our <Link href="/partners" className="text-[#f1b917] hover:underline">partnered cafés</Link>.
        </p>
      </div>
      
      {/* Start button - redirects to catalogue page */}
      <div className="flex flex-row items-center justify-center w-full">
        <Link href="/catalogue">
          <button 
            className="bg-white text-black px-16 py-2 rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-lg"
            onClick={() => {
              // Track when user clicks start to go to catalogue page
              trackEvent('Navigation', 'start_clicked');
              trackEvent('Interaction', 'catalogue_page_visited');
            }}
          >
            Start Creating and Earn
          </button>
        </Link>
      </div>


    </div>
  );
}