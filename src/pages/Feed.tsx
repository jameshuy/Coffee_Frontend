import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { trackEvent } from "@/lib/analytics";
import FeedContent from "@/components/FeedContent";
import { LoginModal } from "@/components/LoginModal";
import { SignUpModal } from "@/components/SignUpModal";
import BottomNavigation from "@/components/BottomNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Feed() {
  
  // Modal states for unauthenticated users
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Track page visit
  useEffect(() => {
    trackEvent("Interaction", "feed_page_visited");
  }, []);

  // Listen for modal events from Navigation
  useEffect(() => {
    const handleOpenLoginModal = () => {
      setIsLoginModalOpen(true);
    };

    const handleOpenSignUpModal = () => {
      setIsSignUpModalOpen(true);
    };

    window.addEventListener("openLoginModal", handleOpenLoginModal);
    window.addEventListener("openSignUpModal", handleOpenSignUpModal);
    window.addEventListener("openSignupModal", handleOpenSignUpModal); // Also listen for lowercase version

    return () => {
      window.removeEventListener("openLoginModal", handleOpenLoginModal);
      window.removeEventListener("openSignUpModal", handleOpenSignUpModal);
      window.removeEventListener("openSignupModal", handleOpenSignUpModal);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black overflow-hidden relative">
      <Navigation />

      <main className={`flex-grow container mx-auto py-0 md:py-2 flex flex-col items-center justify-center text-white ${!isMobile && 'mt-36 pt-8'}`}>
        <div className="w-full max-w-4xl">
          <div className="flex flex-col items-center">
            <div className="mx-auto w-full -mt-1">
              <div className="mb-3 mt-2">
                <FeedContent />
              </div>
            </div>
          </div>
        </div>
      </main>



      {!isMobile ? <Footer /> : <BottomNavigation />}

      {/* Login Modal */}
      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />

      {/* Sign Up Modal */}
      <SignUpModal
        open={isSignUpModalOpen}
        onOpenChange={setIsSignUpModalOpen}
      />
    </div>
  );
}