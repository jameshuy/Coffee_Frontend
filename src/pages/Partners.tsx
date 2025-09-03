import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { LoginModal } from "@/components/LoginModal";
import { SignUpModal } from "@/components/SignUpModal";
import { PartnerModal } from "@/components/PartnerModal";
import cafeHeroImage from "@assets/ChatGPT Image Aug 9, 2025, 01_32_58 PM_1754739185605.jpg";

export default function Partners() {
  const [, setLocation] = useLocation();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Listen for login modal events
  useEffect(() => {
    const handleOpenLoginModal = () => {
      setIsLoginModalOpen(true);
    };

    const handleOpenSignupModal = () => {
      setIsSignUpModalOpen(true);
    };

    window.addEventListener("openLoginModal", handleOpenLoginModal);
    window.addEventListener("openSignupModal", handleOpenSignupModal);

    return () => {
      window.removeEventListener("openLoginModal", handleOpenLoginModal);
      window.removeEventListener("openSignupModal", handleOpenSignupModal);
    };
  }, []);

  const handleTryItClick = () => {
    trackEvent("Interaction", "click_try_it_partners");
    setLocation("/create");
  };

  const handleGetStartedClick = () => {
    trackEvent("Interaction", "click_get_started_partners");
    setIsPartnerModalOpen(true);
  };

  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden">
      {/* Background color fill for areas not covered by the image */}
      <div className="absolute inset-0 bg-neutral-800 z-0"></div>
      
      {/* Background Image */}
      <div 
        className="absolute inset-0 w-full h-full bg-no-repeat z-[1]"
        style={{ 
          backgroundImage: `url(${cafeHeroImage})`,
          backgroundSize: 'contain',
          backgroundPosition: 'center center'
        }}
      ></div>
      
      {/* Dark overlay for text readability - lighter on mobile */}
      <div className="absolute inset-0 bg-black bg-opacity-30 md:bg-opacity-50 z-[2]"></div>
      
      <div className="relative z-20">
        <Navigation transparent />
      </div>
      <main className="relative z-20 flex-grow flex flex-col">
        {/* Top content */}
        <div className="container mx-auto px-4 pt-2 md:pt-6 text-center">
          <p className="text-sm md:text-xl text-white mb-3 md:mb-8 drop-shadow-md px-2">
            Allocate just 1/4<sup>th</sup> of a square meter of unused café space to a community-made collectible posters exhibit
          </p>
          
          <div className="text-center">
            {/* Mobile: Vertical layout with dots before each item */}
            <div className="flex flex-col items-center justify-center text-xs text-white drop-shadow-md space-y-1 md:hidden">
              <div className="flex items-center">
                <span className="text-[#f1b917] mr-2">•</span>
                <span>Monetize idle café space</span>
              </div>
              <div className="flex items-center">
                <span className="text-[#f1b917] mr-2">•</span>
                <span>Drive satisfaction with a <em>buy print, free coffee</em> experience</span>
              </div>
              <div className="flex items-center">
                <span className="text-[#f1b917] mr-2">•</span>
                <span>Boost your margin per cup</span>
              </div>
            </div>
            
            {/* Desktop: Horizontal layout with dots between items */}
            <div className="hidden md:flex items-center justify-center text-lg text-white drop-shadow-md flex-wrap">
              <span>Monetize idle café space</span>
              <span className="text-[#f1b917] mx-3">•</span>
              <span>Drive satisfaction with a <em>buy print, free coffee</em> experience</span>
              <span className="text-[#f1b917] mx-3">•</span>
              <span>Boost your margin per cup</span>
            </div>
          </div>
        </div>
        
        {/* Spacer to push bottom content down */}
        <div className="flex-grow"></div>
        
        {/* Bottom content - fixed at bottom */}
        <div className="container mx-auto px-4 pb-3 md:pb-6 text-center">
          <div className="text-xs md:text-lg text-white drop-shadow-md mb-3 md:mb-6 px-2">
            No upfront costs. We handle logistics. All on consignment.
          </div>
          <button
            onClick={handleGetStartedClick}
            className="bg-[#f1b917] text-black px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold text-base md:text-lg hover:bg-opacity-90 transition-all"
          >
            I want a consignment now
          </button>
        </div>
      </main>
      <div className="relative z-20">
        <Footer transparent />
      </div>
      
      {/* Authentication Modals */}
      <LoginModal 
        open={isLoginModalOpen} 
        onOpenChange={setIsLoginModalOpen}
      />
      
      <SignUpModal 
        open={isSignUpModalOpen} 
        onOpenChange={setIsSignUpModalOpen}
      />
      
      <PartnerModal 
        open={isPartnerModalOpen} 
        onOpenChange={setIsPartnerModalOpen}
      />
    </div>
  );
}