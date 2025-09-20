import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useLocation } from "wouter";
import { trackEvent } from "@/lib/analytics";
import { LoginModal } from "@/components/LoginModal";
import { SignUpModal } from "@/components/SignUpModal";
import { PartnerModal } from "@/components/PartnerModal";
import { PARTNER_CAFES } from "@/data/partner-cafes";

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
      <div className="absolute inset-0 bg-black z-[2]"></div>

      <div className="relative z-20">
        <Navigation transparent />
      </div>
      <main className="relative z-20 flex-grow flex flex-col">
        {/* Top content */}
        <div className="container mx-auto px-4 pt-2 md:pt-6 text-center">
          <p className="text-base md:text-xl text-white font-bold mb-4 md:mb-6 drop-shadow-md px-2">
            Turn unused café space into profit — with no upfront cost.
          </p>
          <p className="text-sm md:text-lg text-white mb-4 md:mb-6 drop-shadow-md px-2">
            Coffee&amp;Prints delivers
            <a href="/catalogue" className="text-[#f1b917] hover:underline transition-colors"> community-made collectible art prints </a>
            on consignment.
          </p>
          <p className="text-sm md:text-lg text-white mb-4 md:mb-6 drop-shadow-md px-2">
            Sell a print, offer a coffee, keep 30% — about triple the profit of selling the coffee alone.
          </p>
          <div className="text-center">
            <div className="flex flex-col items-center justify-center text-sm text-white drop-shadow-md space-y-2 md:hidden w-full">
              <div className="flex flex-col items-start space-y-2">
                <span className="flex">
                  <span className="text-[#f1b917] font-bold mr-2">•</span>
                  <span>Monetize idle café space</span>
                </span>
                <span className="flex">
                  <span className="text-[#f1b917] font-bold mr-2">•</span>
                  <span>Drive customer satisfaction</span>
                </span>
                <span className="flex">
                  <span className="text-[#f1b917] font-bold mr-2">•</span>
                  <span>Boost your margin per cup</span>
                </span>
                <span className="flex">
                  <span className="text-[#f1b917] font-bold mr-2">•</span>
                  <span>Get free rotating art prints</span>
                </span>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-center justify-center text-lg text-white drop-shadow-md space-y-2 mx-auto max-w-2xl">
              <div className="flex flex-col items-start space-y-2">
                <span className="flex">
                  <span className="text-[#f1b917] font-bold mr-2">•</span>
                  <span>Monetize idle café space</span>
                </span>
                <span className="flex">
                  <span className="text-[#f1b917] font-bold mr-2">•</span>
                  <span>Drive customer satisfaction</span>
                </span>
                <span className="flex">
                  <span className="text-[#f1b917] font-bold mr-2">•</span>
                  <span>Boost your margin per cup</span>
                </span>
                <span className="flex">
                  <span className="text-[#f1b917] font-bold mr-2">•</span>
                  <span>Get free rotating art prints</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer to push bottom content down */}
        <div className="w-full py-4 md:py-8 flex justify-center">
          <div className="inline-block">
            <img
              src="/slideshow/partners-hero-new.png"
              alt="Coffee&amp;Prints stand display"
              className="h-auto max-w-[90vw]"
              style={{ width: '280px' }} />
          </div>
        </div>

        <div className="container mx-auto px-4 pt-6 md:pt-12 text-center">
          <p className="text-base md:text-xl text-white font-bold mb-4 md:mb-6 drop-shadow-md px-2">
            Take it further
          </p>

          <p className="text-sm md:text-lg text-white mb-2 md:mb-4 drop-shadow-md px-2">
            Co-design a signature print style in your brand identity.
          </p>

          <p className="text-sm md:text-lg text-white mb-4 md:mb-6 drop-shadow-md px-2">
            Empower your community to create collectible prints in your café's universe, <br />
            expanding your brand story and creating a new collectible medium.
          </p>
        </div>

        {/* Bottom content - fixed at bottom */}
        <div className="container mx-auto px-4 pt-8 md:pt-16 md:pb-6 text-center">
          <p className="text-base md:text-lg text-white font-bold mb-4 md:mb-6 drop-shadow-md px-2">Already brewing with us…</p>

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
          <button
            onClick={handleGetStartedClick}
            className="bg-[#f1b917] text-black px-6 py-3 md:px-8 md:py-4 rounded-lg font-bold text-base md:text-lg hover:bg-opacity-90 transition-all"
          >
            Brew with us
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