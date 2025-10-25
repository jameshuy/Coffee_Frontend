import { trackEvent } from '@/lib/analytics';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'wouter';

// Updated slideshow media - first item is Ferrari video, second is red pop art Ferrari
import { SLIDESHOW_MEDIA } from "@/data/slideshowMedia";
import { PARTNER_CAFES } from '@/data/partner-cafes';

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
    let interval: NodeJS.Timeout;

    // If current media is a video, wait for it to end before moving to next
    if (SLIDESHOW_MEDIA[currentMediaIndex].type === 'video' && videoRef.current) {
      const video = videoRef.current;

      const handleVideoEnd = () => {
        setCurrentMediaIndex((prevIndex) =>
          prevIndex === SLIDESHOW_MEDIA.length - 1 ? 0 : prevIndex + 1
        );
      };

      video.addEventListener('ended', handleVideoEnd);
      video.play().catch(console.error);

      return () => {
        video.removeEventListener('ended', handleVideoEnd);
      };
    } else {
      // For images, change after 1 second
      interval = setInterval(() => {
        setCurrentMediaIndex((prevIndex) =>
          prevIndex === SLIDESHOW_MEDIA.length - 1 ? 0 : prevIndex + 1
        );
      }, 1000);
    }

    // Clean up
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentMediaIndex]);

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
                autoPlay
                controls={false}
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
          Turn moments into collectible prints.
        </p>
        <p className="text-center text-gray-300 font-notosans text-sm sm:text-sm md:text-base lg:text-lg xl:text-xl whitespace-nowrap mb-1">
          Create for you, a friend or a collection.
        </p>
        <p className="text-center text-gray-300 font-notosans text-sm sm:text-sm md:text-base lg:text-lg xl:text-xl whitespace-nowrap">
          Get featured in cafés and earn royalties.
        </p>
      </div>
      <div className="mb-6 flex justify-center w-full overflow-hidden">
        <div className="w-full max-w-[600px] overflow-hidden">
          <div className="flex gap-8 items-center animate-slideLeft" style={{ width: '200%' }}>
            {/* First set of partners */}
            {PARTNER_CAFES.map((partner) => (
              <a
                key={partner.id}
                href={partner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity duration-200 flex-shrink-0"
                onClick={() => {
                  trackEvent('Navigation', 'partner_clicked', partner.name);
                }}
              >
                <div
                  className={`bg-white rounded-md overflow-hidden flex items-center justify-center ${partner.id === 'caffeyolo' ? 'border-2 border-white' : ''}`}
                  style={{
                    height: 'clamp(60px, 15vw, 120px)',
                    width: 'clamp(60px, 15vw, 120px)'
                  }}
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </a>
            ))}
            {/* Duplicate set for seamless loop */}
            {PARTNER_CAFES.map((partner) => (
              <a
                key={`${partner.id}-duplicate`}
                href={partner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block hover:opacity-80 transition-opacity duration-200 flex-shrink-0"
                onClick={() => {
                  trackEvent('Navigation', 'partner_clicked', partner.name);
                }}
              >
                <div
                  className={`bg-white rounded-md overflow-hidden flex items-center justify-center ${partner.id === 'caffeyolo' ? 'border-2 border-white' : ''}`}
                  style={{
                    height: 'clamp(60px, 15vw, 120px)',
                    width: 'clamp(60px, 15vw, 120px)'
                  }}
                >
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
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
            Start Creating
          </button>
        </Link>
      </div>


    </div>
  );
}