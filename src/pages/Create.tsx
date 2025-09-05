import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ImageUploader from "@/components/ImageUploader";
import VideoFrameSelector from "@/components/VideoFrameSelector";
import ShippingForm from "@/components/ShippingForm";
import CheckoutForm from "@/components/CheckoutForm";
import OrderSummary from "@/components/OrderSummary";
import { StyleSelector } from "@/components/StyleSelector";
import { STYLES, FEELINGS, FREE_STYLES, type StyleData, type FeelingData } from "@/data";
import SubscriptionModal from "@/components/SubscriptionModal";
import SellPosterModal from "@/components/SellPosterModal";
import ShareModal from "@/components/ShareModal";
import WelcomeModal from "@/components/WelcomeModal";
import { AccountCreationModal } from "@/components/AccountCreationModal";
import { LoginModal } from "@/components/LoginModal";
import { SignUpModal } from "@/components/SignUpModal";
import UnauthenticatedView from "@/components/UnauthenticatedView";
import { Button } from "@/components/ui/Button";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import Confetti from "react-confetti";
import { trackEvent } from "@/lib/analytics";
import { RotateCcw, Tag, Share2, ArrowLeft } from "lucide-react";
import { preventImageDownload } from "@/lib/image-protection";
import { useCreateFlow } from "@/hooks/useCreateFlow";
import { useOrderFlow } from "@/hooks/useOrderFlow";

type Step = "upload" | "customize" | "shipping";

// Make sure to load stripe outside of components
// This should be your publishable key from Stripe
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error(
    "Missing Stripe public key. Make sure VITE_STRIPE_PUBLIC_KEY is set.",
  );
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function Create() {
  // Authentication state
  const { isAuthenticated, user } = useAuth();

  // Use the custom hook for poster creation logic
  const {
    formData,
    setFormData,
    updateFormDataField,
    handleFileUpload,
    handleVideoUpload,
    handleVideoFrameSelect,
    handleVideoFrameCancel,
    handleTextSave,
    handleTextCancel,
    handleGeneratePoster,
    credits: availableCredits,
    hasPaidCredits,
    showVideoFrameSelector,
    setShowVideoFrameSelector,
    isUploadingVideo,
    isGeneratingPoster,
    isPosterGenerated,
    showStyles,
    setShowStyles,
    userEmail,
    isEmailVerified,
    resetFormData,
    fetchCredits,
  } = useCreateFlow();

  // Use the custom hook for order processing logic
  const {
    shippingInfo,
    setShippingInfo,
    paymentInfo,
    setPaymentInfo,
    orderSummary,
    isPlacingOrder,
    isProcessingPayment,
    processingPaymentStatus,
    orderCompleted,
    orderNumber,
    error,
    quantity,
    setQuantity,
    calculatePosterPrice,
    calculateShipping,
    calculateTotal,
    handlePlaceOrder,
    handleShippingComplete,
    handlePaymentComplete,
    resetOrderState,
  } = useOrderFlow();

  // Authentication modal states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignUpModalOpen, setIsSignUpModalOpen] = useState(false);

  // State for account creation modal
  const [isAccountCreationModalOpen, setIsAccountCreationModalOpen] =
    useState<boolean>(false);
  const [shouldShowAccountCreation, setShouldShowAccountCreation] =
    useState<boolean>(false);

  // Auto-start creation process when page loads
  useEffect(() => {
    // If user is authenticated via proper login, set up creation workflow
    if (isAuthenticated && user?.email) {
      setShowUploader(true);
      // Fetch credits immediately when authenticated user loads the page
      fetchCredits();
    } else {
      // Check for legacy email verification
      const storedEmail = localStorage.getItem("posterTheMoment_verifiedEmail");
      if (storedEmail) {
        setShowUploader(true);
        // Fetch credits for legacy email users too
        fetchCredits();
      } else {
        // Only open email verification modal for completely non-authenticated users
        // Don't show for users who are properly logged in but don't have legacy email
        if (!isAuthenticated) {
          setShowUploader(false);
        }
      }
    }
    trackEvent("Interaction", "create_page_visited");
  }, [isAuthenticated, user, fetchCredits]);

  // Listen for credit purchase modal events from Navigation
  useEffect(() => {
    const handleOpenCreditModal = () => {
      setIsCreditPurchaseModalOpen(true);
    };

    const handleOpenLoginModal = () => {
      setIsLoginModalOpen(true);
    };

    const handleShowWelcomeModal = () => {
      setIsWelcomeModalOpen(true);
    };

    window.addEventListener("openCreditPurchaseModal", handleOpenCreditModal);
    window.addEventListener("openLoginModal", handleOpenLoginModal);
    window.addEventListener("showWelcomeModal", handleShowWelcomeModal);

    return () => {
      window.removeEventListener(
        "openCreditPurchaseModal",
        handleOpenCreditModal,
      );
      window.removeEventListener("openLoginModal", handleOpenLoginModal);
      window.removeEventListener("showWelcomeModal", handleShowWelcomeModal);
    };
  }, []);

  const handlePurchaseCredits = () => {
    // Account creation disabled - all users have unlimited access
    // Show credit purchase modal directly
    setIsCreditPurchaseModalOpen(true);
  };

  // Function to check if free credits are exhausted
  const checkFreeCreditsExhausted = async (email: string) => {
    try {
      const response = await apiRequest(
        "GET",
        `/api/auth/check-free-credits?email=${encodeURIComponent(email)}`,
      );

      if (response.ok) {
        const data = await response.json();        // Credits check completed

        // Account creation disabled - all users have unlimited access
        // setShouldShowAccountCreation(true); - disabled
      }
    } catch (error) {
      console.error("Error checking free credits status:", error);
    }
  };

  // Handle account creation success
  const handleAccountCreationSuccess = () => {
    setIsAccountCreationModalOpen(false);
    setShouldShowAccountCreation(false);

    // Show welcome modal for new users
    setIsWelcomeModalOpen(true);

    // Track the account creation event
    trackEvent(
      "Account",
      "account_created",
      userEmail?.split("@")[1] || "unknown",
    );
  };

  const handleCreditPurchaseComplete = () => {
    setIsCreditPurchaseModalOpen(false);
    // Check credits again after purchase
    fetchCredits();
    // Reset account creation flag as user has purchased credits
    setShouldShowAccountCreation(false);
    trackEvent("Purchase", "credits_purchase_complete");

    // Notify Navigation to update credits
    window.dispatchEvent(new CustomEvent("creditsUpdated"));

    toast({
      title: "Credits purchased",
      description: "Your credits have been added to your account.",
      variant: "default",
    });
  };

  // Initial credits fetch using email from localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem("posterTheMoment_verifiedEmail");
    if (storedEmail) {
      fetchCredits();
      // Also check if user has exhausted free credits and should create an account
      checkFreeCreditsExhausted(storedEmail);
    }
  }, [fetchCredits]);



  // Function to handle Order Poster (A3) button click
  const handleOrderPoster = () => {
    // Set the step to shipping to show the shipping form
    setStep("shipping");
    // Track the event using the hook
    handlePlaceOrder();
    // Scroll to the shipping form
    setTimeout(() => {
      window.scrollTo({
        top: document.getElementById("shipping-form-section")?.offsetTop || 0,
        behavior: "smooth",
      });
    }, 100);
  };

  // State for Share Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Function to handle Share button click
  const handleShareClick = () => {
    // Open the share modal
    setIsShareModalOpen(true);
    // Track the event
    trackEvent("Share", "share_click");
  };

  // Function to handle Sell button click - sets the image as public
  const handleSellClick = () => {
    // Account creation disabled - all users have unlimited access

    // Track the event
    trackEvent("Selling", "sell_button_clicked");

    if (generatedPosterUrl && userEmail) {
      // Always open the sell poster modal - it will handle subscription checking internally
      setIsSellPosterModalOpen(true);
    } else {
      // Show message if there's no image or user email
      toast({
        title: "Unable to Sell",
        description:
          "You need to create a poster and verify your email before selling.",
        variant: "default",
        duration: 4000,
      });
    }
  };

  // Save modal functionality removed as requested

  // Function to handle Add Text button click
  const handleAddTextClick = () => {
    // Track the event
    trackEvent("Customization", "add_text_clicked");

    // Show text overlay tool
    setShowTextTool(true);

    // Save modal functionality removed
  };


  const [step, setStep] = useState<Step>("upload");
  const [shippingData, setShippingData] = useState<any>(null);
  const [paymentReady, setPaymentReady] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  
  // Filter styles based on subscription status
  const getAvailableStyles = () => {
    // Check if user is an active artistic collective member
    const isSubscribed = user?.userType === "artistic_collective";

    if (isSubscribed) {
      return STYLES; // All styles available for subscribers
    } else {
      return STYLES.filter((style) => FREE_STYLES.includes(style.id));
    }
  };

  const availableStyles = getAvailableStyles();

  // Initialize selected style with first available style
  const [selectedStyle, setSelectedStyle] = useState<StyleData>(availableStyles[0]);
  const [generatedPosterUrl, setGeneratedPosterUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Track window dimensions for confetti
  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // State to control whether to show the uploader or hero video
  const [showUploader, setShowUploader] = useState(false);

  // Modal states
  const [isCreditPurchaseModalOpen, setIsCreditPurchaseModalOpen] = useState(false);
  const [isSellPosterModalOpen, setIsSellPosterModalOpen] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);
  const [showTextTool, setShowTextTool] = useState<boolean>(false);

  // Update window dimensions when window resizes
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Apply image protection to prevent easy downloading
  useEffect(() => {
    // This will prevent right-click, context menu and touch-hold actions on all images
    const cleanup = preventImageDownload();
    return cleanup;
  }, []);

  // Function to create a new poster (reset state and go back to upload step)
  const handleCreateAnotherPoster = () => {
    // Check if user should create an account (free credits = 2 and no account)
    if (shouldShowAccountCreation) {
      // Show account creation modal before allowing to create another poster
      setIsAccountCreationModalOpen(true);
      trackEvent(
        "Account",
        "account_creation_prompted",
        "create_another_poster_click",
      );
      return;
    }

    // Track the event
    trackEvent("Interaction", "create_another_poster");

    // Reset state to allow for a new upload
    setStep("upload");
    resetFormData(STYLES[0]);
    resetOrderState();
    setSelectedStyle(STYLES[0]);
    setShowTextTool(false);
  };



  return (
    <div className="flex flex-col min-h-screen bg-black overflow-hidden">

      <>
        <Navigation />

        <main className="flex-grow container mx-auto px-4 py-0 md:py-2 flex flex-col items-center justify-center text-white">
          <div className="w-full max-w-4xl">
            <div className="flex flex-col items-center">
              {/* Heading removed as it's now in the Navigation component */}

              <div className="mx-auto w-full -mt-1">
                {!isAuthenticated &&
                  (!showUploader || !isEmailVerified || !userEmail) ? (
                  /* Show landing page style view for non-authenticated users */
                  <div className="flex flex-col items-center justify-center p-8">
                    <UnauthenticatedView
                      onLoginClick={() => setIsLoginModalOpen(true)}
                      onSignupClick={() => setIsSignUpModalOpen(true)}
                    />
                  </div>
                ) : (
                  /* Image Uploader + Style Selection Section */
                  <>
                    {/* Generation Credits - Hidden as requested */}

                    <div
                      className={`mb-3 ${isPosterGenerated ? "mt-16" : "mt-6"}`}
                    >
                      {/* Show video frame selector or image uploader */}
                      {showVideoFrameSelector ? (
                        <VideoFrameSelector
                          videoFile={formData.uploadedVideo!}
                          videoPath={formData.uploadedVideoPath}
                          isUploadingVideo={isUploadingVideo}
                          onFrameSelected={handleVideoFrameSelect}
                          onCancel={handleVideoFrameCancel}
                        />
                      ) : (
                        // Show ImageUploader only when not showing styles
                        !showStyles ? (
                          <ImageUploader
                            onImageUpload={handleFileUpload}
                            onVideoUpload={handleVideoUpload}
                            uploadedImage={formData.uploadedImage}
                            uploadedVideo={formData.uploadedVideo}
                            videoFrameData={formData.videoFrameData}
                            isGenerated={isPosterGenerated}
                            isGenerating={isGeneratingPoster}
                            isUploadingVideo={isUploadingVideo}
                            onTextAdd={handleTextSave}
                            showTextTool={showTextTool}
                            onTextToolClose={handleTextCancel}
                            textOverlay={formData.textOverlay}
                            onImageError={() => updateFormDataField('uploadedImage', null)}
                          />
                        ) : (
                          formData.uploadedImage &&
                            step === "upload" &&
                            !isPosterGenerated &&
                            !isGeneratingPoster && (
                              <div className="w-full -mt-1">
                                {/* Subheading for style selection - only show when styles are visible */}
                                {showStyles && (
                                  <h3 className="text-white text-xl font-racing-sans text-center mb-4">
                                    Scroll to pick a poster style
                                  </h3>
                                )}
      
                                {/* Negative margin to move it up slightly */}
                                <StyleSelector
                                  styles={availableStyles}
                                  selectedStyle={selectedStyle}
                                  onSelectStyle={setSelectedStyle}
                                  showAsButton={!showStyles}
                                  onPickStyleClick={() => setShowStyles(true)}
                                />
                              </div>
                            )
                        )
                      )}
                      {/* "Create Another Poster" button has been moved out of this container */}
                    </div>

                    {/* Show style selector based on showStyles state */}
                    
                  </>
                )}
              </div>

              {/* Show Generate button only when styles are visible and not generating/generated yet */}
              {showUploader &&
                formData.uploadedImage &&
                showStyles &&
                step === "upload" &&
                !isPosterGenerated &&
                !isGeneratingPoster && (
                  <div className="flex items-center gap-4 -mt-4">
                    <Button
                      variant="secondary_gray"
                      size="base"
                      onClick={() => {
                        setShowStyles(false);
                        updateFormDataField('uploadedImage', null);
                        updateFormDataField('uploadedVideo', null);
                        updateFormDataField('uploadedVideoPath', null);
                        updateFormDataField('videoFrameData', null);
                        setSelectedStyle(availableStyles[0]);
                      }}
                    >
                      <ArrowLeft size={20} />
                      Back
                    </Button>

                    <Button
                      id="create-poster-button"
                      variant="primary"
                      size="large"
                      onClick={() => handleGeneratePoster(selectedStyle)}
                      disabled={isGeneratingPoster}
                    >
                      create my poster
                    </Button>
                  </div>
                )}
            </div>

            {/* Customize Step - "Add Aesthetics" step between styles and generation */}
            {step === "customize" &&
              formData.uploadedImage &&
              !isGeneratingPoster &&
              !isPosterGenerated && (
                <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-4">
                  {/* Add Feel heading */}
                  <div className="text-center mb-3">
                    <h3 className="text-white text-xl font-racing-sans">
                      Describe how this moment made you feel
                    </h3>
                    <p className="text-gray-300 text-sm mt-1">Pick up to 3</p>
                  </div>

                  {/* Selectable Chips Grid */}
                  <div className="flex flex-wrap justify-center gap-3 mb-8 max-w-3xl">
                    {FEELINGS.map((feeling) => {
                      const isSelected = formData.selectedFeelings.includes(
                        feeling.id,
                      );
                      const canSelect =
                        formData.selectedFeelings.filter((f: string) => f !== "").length < 3;

                      return (
                        <button
                          key={feeling.id}
                          onClick={() => {
                            if (isSelected) {
                              // Deselect - remove from array
                              const newFeelings = formData.selectedFeelings.map((f: string) =>
                                f === feeling.id ? "" : f,
                              );
                              updateFormDataField('selectedFeelings', newFeelings);
                            } else if (canSelect) {
                              // Select - add to first empty slot
                              const newFeelings = [...formData.selectedFeelings];
                              const emptyIndex = newFeelings.findIndex(
                                (f: string) => f === "",
                              );
                              if (emptyIndex !== -1) {
                                newFeelings[emptyIndex] = feeling.id;
                                updateFormDataField('selectedFeelings', newFeelings);
                              }
                            }
                          }}
                          disabled={!isSelected && !canSelect}
                          className={`
                              px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                              ${isSelected
                              ? "bg-white text-black shadow-lg"
                              : canSelect
                                ? "border border-gray-400 text-gray-300 hover:border-white hover:text-white hover:shadow-md"
                                : "border border-gray-600 text-gray-500 cursor-not-allowed"
                            }
                            `}
                        >
                          {feeling.name}
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation buttons */}
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => setStep("upload")}
                      className="px-4 py-3 bg-gray-600 text-white rounded font-racing-sans hover:bg-gray-700 transition-colors duration-200 text-lg flex items-center gap-2"
                    >
                      <ArrowLeft size={20} />
                      Back
                    </Button>

                    <Button
                      className="px-6 py-3 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-lg"
                      onClick={() => handleGeneratePoster(selectedStyle)}
                      disabled={isGeneratingPoster}
                    >
                      create my poster
                    </Button>
                  </div>
                </div>
              )}

            {/* Added confetti effect when order is completed - placed outside other sections to cover the whole page */}
            {orderCompleted && (
              <Confetti
                width={windowDimensions.width}
                height={windowDimensions.height}
                recycle={false}
                numberOfPieces={500}
                gravity={0.2}
                confettiSource={{
                  x: windowDimensions.width / 2,
                  y: 0,
                  w: 0,
                  h: 0,
                }}
                style={{ position: "fixed", top: 0, left: 0, zIndex: 100 }}
              />
            )}

            {/* Action buttons shown when poster is generated regardless of step (always visible after generation) */}
            {formData.uploadedImage && isPosterGenerated && !orderCompleted && (
              <div className="flex flex-col items-center w-full">
                {/* Action buttons in first row */}
                <div className="flex flex-nowrap justify-center items-center overflow-x-auto gap-2 mt-16 md:gap-3 px-2 w-full max-w-full">
                  <Button
                    className="flex-none whitespace-nowrap px-3 sm:px-4 py-2 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-xs sm:text-sm"
                    onClick={handleOrderPoster}
                  >
                    Order (A3)
                  </Button>
                  {/* Add Text button disabled as requested */}

                  {/* Share button with Web Share API */}
                  {isAuthenticated && (
                    <Button
                      className="flex-none whitespace-nowrap px-3 sm:px-4 py-2 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-xs sm:text-sm flex items-center"
                      onClick={handleShareClick}
                    >
                      <Share2 size={16} className="mr-1" /> Share
                    </Button>
                  )}

                  {/* Sell button - visible to all authenticated users */}
                  {isAuthenticated && (
                    <Button
                      className="flex-none whitespace-nowrap px-3 sm:px-4 py-2 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-xs sm:text-sm flex items-center"
                      onClick={handleSellClick}
                    >
                      <Tag size={16} className="mr-1" /> Sell
                    </Button>
                  )}
                  <Button
                    className="flex-none whitespace-nowrap px-3 sm:px-4 py-2 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-xs sm:text-sm flex items-center justify-center"
                    onClick={handleCreateAnotherPoster}
                    aria-label="New Poster"
                  >
                    <RotateCcw size={16} />
                  </Button>
                </div>

                {/* Credits indicator removed from here - moved to Navigation */}



              </div>
            )}

            {/* Hide buttons in shipping form when payment is ready */}
            {step === "shipping" && paymentReady && (
              <div className="hidden">
                {/* Buttons are hidden during payment */}
              </div>
            )}

            {/* Save modal - functionality removed as requested */}

            {/* Only show the shipping & payment flow if order is not completed */}
            {step === "shipping" && formData.uploadedImage && !orderCompleted && (
              <div id="shipping-form-section" className="w-full mt-12">
                {!paymentReady && (
                  <>
                    {/* Order Summary */}
                    <div className="max-w-md mx-auto mb-8">
                      <OrderSummary />
                    </div>

                    <h2 className="text-xl md:text-2xl font-racing-sans mb-8 text-center text-white">
                      Shipping Information
                    </h2>
                  </>
                )}

                {/* Only show shipping form if payment not ready yet */}
                {!paymentReady && (
                  <>
                    {/* Shipping form with hidden submit button */}
                    <ShippingForm
                      imageDataUrl={formData.uploadedImage || ""}
                      onSuccess={(data) => {
                        handleShippingComplete(data);
                        setShippingData(data);
                        setStripeClientSecret(paymentInfo.clientSecret);
                        setConfirmationId(paymentInfo.confirmationId);
                        setPaymentReady(true);
                      }}
                      hideSubmitButton={true}
                    />

                    {/* Price breakdown moved after shipping form and before payment button */}
                    <div className="mt-6 mb-6 p-4 border rounded-lg bg-gray-50 text-black">
                      <h3 className="text-lg font-notosans mb-2 text-black">
                        Order Summary
                      </h3>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center">
                          <span className="text-black mr-3">
                            Custom A3 Poster:
                          </span>
                          <div className="flex items-center border rounded">
                            <button
                              type="button"
                              onClick={() =>
                                setQuantity(Math.max(1, quantity - 1))
                              }
                              className="px-2 py-1 border-r hover:bg-gray-200"
                              aria-label="Decrease quantity"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                            </button>
                            <span className="px-3 py-1">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => setQuantity(quantity + 1)}
                              className="px-2 py-1 border-l hover:bg-gray-200"
                              aria-label="Increase quantity"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                              </svg>
                            </button>
                          </div>
                        </div>
                        <span className="text-black">
                          CHF {calculatePosterPrice()}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-black">Shipping:</span>
                        <span className="text-black">
                          CHF {calculateShipping()}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 mt-2">
                        <span className="text-black">Total:</span>
                        <span className="text-black">
                          CHF {calculateTotal()}
                        </span>
                      </div>
                      <div className="text-center mt-3">
                        <p className="text-gray-600 text-xs">
                          Printed in Switzerland 🇨🇭 Delivered to your door.
                        </p>
                      </div>
                    </div>

                    {/* Separate payment button */}
                    <div className="pt-4">
                      <Button
                        onClick={() => {
                          // Manually trigger the form submission
                          const submitButton = document.getElementById(
                            "shipping-form-submit",
                          ) as HTMLButtonElement;
                          if (submitButton) {
                            submitButton.click();
                          }
                        }}
                        className="w-full py-3 px-4 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-lg"
                        disabled={isProcessingPayment}
                      >
                        {isProcessingPayment ? (
                          <div className="flex items-center justify-center">
                            <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent rounded-full"></span>
                            Processing...
                          </div>
                        ) : (
                          "Proceed to Payment"
                        )}
                      </Button>
                    </div>
                  </>
                )}

                {/* Show payment form when payment is ready */}
                {paymentReady && stripeClientSecret && (
                  <div className="max-w-md mx-auto mt-24">
                    <h2 className="text-xl md:text-2xl font-racing-sans mb-12 text-center text-white">
                      Payment
                    </h2>

                    {/* Shipping Information Summary */}
                    {shippingData && (
                      <div className="bg-white rounded-lg p-4 mb-4 text-gray-800">
                        <h3 className="text-lg font-notosans mb-2 text-black">
                          Shipping Information
                        </h3>
                        <div className="grid grid-cols-1 gap-1 text-sm">
                          <div>
                            <span className="font-medium">
                              {shippingData.firstName} {shippingData.lastName}
                            </span>
                          </div>
                          <div>{shippingData.address}</div>
                          <div>
                            {shippingData.zipCode} {shippingData.city},{" "}
                            {shippingData.state}
                          </div>
                          <div>{shippingData.country}</div>
                          <div className="mt-1">
                            <span className="font-medium">Email: </span>
                            {shippingData.email}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Summary */}
                    <div className="bg-white rounded-lg p-4 mb-4 text-gray-800">
                      <h3 className="text-lg font-notosans mb-2 text-black">
                        Order Summary
                      </h3>
                      <div className="flex justify-between mb-2">
                        <span className="text-black">
                          Gallery-grade A3 Poster x{quantity}:
                        </span>
                        <span className="text-black whitespace-nowrap font-medium">
                          CHF {calculatePosterPrice()}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-black">Shipping:</span>
                        <span className="text-black whitespace-nowrap font-medium">
                          CHF {calculateShipping()}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 mt-2">
                        <span className="text-black">Total:</span>
                        <span className="text-black whitespace-nowrap text-lg">
                          CHF {calculateTotal()}
                        </span>
                      </div>
                      <div className="text-center mt-3">
                        <p className="text-gray-600 text-xs">
                          Printed in Switzerland 🇨🇭 Delivered to your door.
                        </p>
                      </div>
                    </div>

                    {stripePromise ? (
                      <Elements
                        stripe={stripePromise}
                        options={{
                          clientSecret: stripeClientSecret,
                          // Disable Link in the Elements context
                          appearance: {
                            rules: {
                              ".Link": {
                                display: "none",
                              },
                            },
                          },
                        }}
                      >
                        <CheckoutForm
                          onPaymentComplete={(paymentIntentId) => 
                            handlePaymentComplete(
                              paymentIntentId,
                              generatedPosterUrl || undefined,
                              originalImageUrl || undefined,
                              selectedStyle.id
                            )
                          }
                          processingStatus={processingPaymentStatus}
                          onBack={() => setPaymentReady(false)}
                        />
                      </Elements>
                    ) : (
                      <div className="text-center p-4 bg-yellow-100 text-yellow-800 rounded">
                        <p>Stripe is not configured. Please set VITE_STRIPE_PUBLIC_KEY in your .env file.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Show success view when order completed */}
            {step === "shipping" && formData.uploadedImage && orderCompleted && (
              <div className="w-full max-w-2xl mx-auto">
                <div className="flex flex-col items-center justify-center text-center p-8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 text-green-500 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">
                    Thank You!
                  </h2>
                  <p className="text-lg mb-2 text-white">
                    Your order has been placed successfully.
                  </p>
                  <p className="text-md mb-6 text-gray-300">
                    Order Number: {orderNumber}
                  </p>
                  <p className="text-md mb-8 text-white">
                    Your order is being processed by our printing team in
                    Switzerland.
                  </p>

                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {/* Credits indicator displayed first - made clickable */}
                    <div className="flex items-center mr-2">
                      <button
                        onClick={handlePurchaseCredits}
                        className="px-3 py-2 bg-white text-black text-sm rounded-md font-medium hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        Credits: {availableCredits}
                      </button>
                    </div>

                    {/* Only show "Create another poster" button after order completion */}
                    <Button
                      onClick={() => {
                        // Account creation disabled - all users have unlimited access
                        // Otherwise proceed with creating another poster
                        handleCreateAnotherPoster();
                      }}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-xs sm:text-sm flex items-center justify-center"
                      aria-label="Create another poster"
                    >
                      <RotateCcw size={16} />
                    </Button>

                    {/* Add Sell button to order confirmation screen */}
                    <Button
                      onClick={() => {
                        // Check if user should create an account (free credits = 2 and no account)
                        if (shouldShowAccountCreation) {
                          // Show account creation modal before allowing to sell poster
                          setIsAccountCreationModalOpen(true);
                          trackEvent(
                            "Account",
                            "account_creation_prompted",
                            "confirm_sell_poster",
                          );
                        } else {
                          // Otherwise proceed with selling the poster
                          handleSellClick();
                        }
                      }}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-xs sm:text-sm flex items-center gap-2"
                    >
                      <Tag size={16} /> Sell
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer showTopLine={true} />
      </>
      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={isCreditPurchaseModalOpen}
        onClose={() => {
          setIsCreditPurchaseModalOpen(false);
          // Reset upload state when modal closes to prevent unwanted interface showing
          updateFormDataField('uploadedImage', null);
          setShowStyles(false);
        }}
        email={userEmail}
        onSubscriptionComplete={handleCreditPurchaseComplete}
      />

      {/* Save Modal removed as requested */}

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        imageUrl={generatedPosterUrl}
      />

      {/* Sell Poster Modal */}
      <SellPosterModal
        isOpen={isSellPosterModalOpen}
        onClose={() => setIsSellPosterModalOpen(false)}
        userEmail={userEmail}
        posterPath={
          generatedPosterUrl
            ? generatedPosterUrl
              .replace("/generated/", "/thumbnails/")
              .replace(".png", ".jpg")
            : null
        }
      />

      {/* Welcome Modal */}
      <WelcomeModal
        isOpen={isWelcomeModalOpen}
        onClose={() => setIsWelcomeModalOpen(false)}
      />

      {/* Account Creation Modal */}
      <AccountCreationModal
        email={userEmail || ""}
        open={isAccountCreationModalOpen}
        onOpenChange={setIsAccountCreationModalOpen}
        onSuccess={handleAccountCreationSuccess}
      />

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
