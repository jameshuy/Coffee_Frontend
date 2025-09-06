import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";
import { useQuery } from "@tanstack/react-query";

export default function Earn() {
  const [, setLocation] = useLocation();

  // Fetch public images for the carousel with proper error handling
  const { data: publicImages, isLoading, error } = useQuery({
    queryKey: ["/api/public-images"],
    select: (data: any) => data?.images || [],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Scroll to top when earn page is loaded
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Function to handle "Start Creating" button click - navigate to feed page
  const handleStartCreating = () => {
    // Navigate directly to the feed page
    setLocation('/feed');
    
    // Track the interaction
    trackEvent('Navigation', 'start_creating_clicked');
    trackEvent('Engagement', 'creation_started');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 pt-8 pb-6 relative">
        {/* New introductory text */}
        <div className="max-w-4xl mx-auto text-center mb-8">
          <p className="text-lg text-gray-300 font-notosans leading-relaxed">
            Most moments vanish into the feed—forgotten, buried, invisible.
            <br />
            <br />
            <span className="font-racing-sans text-2xl"><span className="text-white">poster</span> <span className="text-white">the</span> <span className="text-[#f1b917]">moment</span></span> transforms the one that mattered into a gallery-grade collectible masterpiece—because some moments are worth framing.
            <br />
          </p>
        </div>

        {/* Hero video - matching landing page style */}
        <div className="w-full flex justify-center mt-8 mb-12">
          <div className="w-[80%] sm:w-full max-w-[350px] relative" style={{ aspectRatio: '1/1.414' }}>
            <div className="w-full h-full overflow-hidden outline outline-[18px] outline-white">
              <video 
                src="/slideshow/hero-clip.mp4"
                className="w-full h-full object-cover select-none pointer-events-none"
                style={{ backgroundColor: 'black', userSelect: 'none' }}
                autoPlay
                loop
                muted
                playsInline
                onContextMenu={(e) => e.preventDefault()}
              />
              
              {/* Overlay with semi-transparent gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
            </div>
          </div>
        </div>

        {/* Why Poster The Moment section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-8 text-center flex items-center justify-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                Why <span className="font-racing-sans text-xl sm:text-2xl font-bold whitespace-nowrap"><span className="text-white">poster</span> <span className="text-white">the</span> <span className="text-[#f1b917]">moment</span></span>?
              </span>
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                  <span className="text-white mr-3">•</span>
                  Escape the Doomscroll
                </h3>
                <p className="text-gray-300 font-notosans ml-6">
                  Turn your post into a permanent and collectible poster - printed in Switzerland on gallery-grade paper.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                  <span className="text-white mr-3">•</span>
                  Your story earns
                </h3>
                <p className="text-gray-300 font-notosans ml-6">
                  Sell your prints on the catalogue as standard and limited edition drops.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
                  <span className="text-white mr-3">•</span>
                  Join a movement
                </h3>
                <p className="text-gray-300 font-notosans ml-6">
                  Look forward to moments with exclusive invites to gallery gigs in your hometown.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* What Others Have Created section */}
        <div className="max-w-5xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Moments Others Have Collected</h2>
        </div>

        {/* Featured works gallery */}
        <div className="w-full mb-8">
          <div className="flex gap-8 overflow-hidden pb-4 px-4 max-w-6xl mx-auto">
            <div className="flex gap-8 animate-scroll-slow">
              {publicImages && Array.isArray(publicImages) && publicImages.length > 0 ? (
                // Duplicate the content for seamless infinite scroll
                [...Array(3).fill(null)].map((_, duplicateIndex) => 
                  publicImages.slice(0, 12).map((image: any, index: number) => (
                    <div
                      key={`${duplicateIndex}-${image.id}`}
                      className="aspect-[3/4] w-48 md:w-64 lg:w-72 flex-shrink-0 overflow-hidden bg-white/5 border-8 border-white"
                    >
                      <img
                        src={import.meta.env.VITE_API_URL + image.imageUrl}
                        alt={`Featured work ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          // Replace broken images with placeholder
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-content')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-content w-full h-full flex items-center justify-center bg-white/10';
                            fallback.innerHTML = '<span class="text-white/60 text-xs">Art</span>';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    </div>
                  ))
                )
              ) : (
                // Show loading skeleton grid - also duplicated
                [...Array(3).fill(null)].map((_, duplicateIndex) => 
                  [...Array(12).fill(null)].map((_, index) => (
                    <div
                      key={`skeleton-${duplicateIndex}-${index}`}
                      className="aspect-[3/4] w-48 md:w-64 lg:w-72 flex-shrink-0 bg-gradient-to-br from-white/10 to-white/5 border-8 border-white flex items-center justify-center animate-pulse"
                    >
                      <div className="w-24 h-32 bg-white/20 flex items-center justify-center">
                        <span className="text-white/40 text-sm">
                          {isLoading ? '...' : 'Art'}
                        </span>
                      </div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

        </div>

        {/* Subheading above Start Creating button */}
        <div className="max-w-5xl mx-auto mb-8">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Try For Free</h2>
        </div>

        {/* Start Creating button */}
        <div className="text-center mb-12">
          <button 
            onClick={handleStartCreating}
            className="bg-white text-black px-8 py-3 rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-lg"
          >
            Start Creating
          </button>
        </div>
        
      </main>
      
      <Footer />
    </div>
  );
}