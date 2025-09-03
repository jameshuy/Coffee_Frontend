import { useEffect, useState, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import LandingPageContent from "@/components/LandingPageContent";
import { LoginModal } from "@/components/LoginModal";
import { SignUpModal } from "@/components/SignUpModal";

export default function Home() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);
  const handleOpenLoginModal = useCallback(() => setIsLoginModalOpen(true), []);
  const handleOpenSignupModal = useCallback(() => setIsSignUpModalOpen(true), []);

  // Listen for login/signup modal events
  useEffect(() => {
    window.scrollTo(0, 0);

    window.addEventListener("openLoginModal", handleOpenLoginModal);
    window.addEventListener("openSignupModal", handleOpenSignupModal);

    return () => {
      window.removeEventListener("openLoginModal", handleOpenLoginModal);
      window.removeEventListener("openSignupModal", handleOpenSignupModal);
    };
  }, [handleOpenLoginModal, handleOpenSignupModal]);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navigation />
      <main className="flex-grow container mx-auto px-4 pt-6 pb-6">
        <LandingPageContent />
      </main>
      <Footer />
      
      {/* Authentication Modals */}
      <LoginModal 
        open={isLoginModalOpen} 
        onOpenChange={setIsLoginModalOpen}
      />
      
      <SignUpModal 
        open={isSignUpModalOpen} 
        onOpenChange={setIsSignUpModalOpen}
      />
    </div>
  );
}