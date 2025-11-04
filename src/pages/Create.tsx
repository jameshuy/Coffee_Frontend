import { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useLocation } from "wouter";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
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
import { trackEvent, trackPosterGeneration, trackTiming, trackError } from "@/lib/analytics";
import { RotateCcw, Tag, Share2, ArrowLeft } from "lucide-react";
import { preventImageDownload } from "@/lib/image-protection";
import { useCreateFlow } from "@/hooks/useCreateFlow";
import { useOrderFlow } from "@/hooks/useOrderFlow";
import { useIsMobile } from "@/hooks/use-mobile";
import { useDeviceInfo } from "@/hooks/check-device";
import BottomNavigation from "@/components/BottomNavigation";
import TextOverlayTool from "@/components/TextOverlayTool";
import { constructPrompt } from "@/lib/utils";
import { videoFileStorage } from "@/components/ImageSourceModal";
import ImageUploader from "@/components/ImageUploader";

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
  const isMobile = useIsMobile();

  // Use the custom hook for poster creation logic
  type TextOverlay = { text: string; position: { x: number; y: number } };
  type SelectedVideoFrame = { frameDataUrl: string; timestamp: number; videoDuration: number; videoPath?: string };
  type FormData = {
    uploadedImage: string | null;
    uploadedVideo: File | null;
    uploadedVideoPath: string | null;
    videoFrameData: SelectedVideoFrame | null;
    selectedStyle: any;
    selectedFeelings: string[];
    textOverlay: TextOverlay | null;
  };

  const [formData, setFormDataState] = useState<FormData>({
    uploadedImage: null,
    uploadedVideo: null,
    uploadedVideoPath: null,
    videoFrameData: null,
    selectedStyle: null,
    selectedFeelings: ["", "", ""],
    textOverlay: null,
  });
  const setFormData = (updates: Partial<FormData>) => setFormDataState(prev => ({ ...prev, ...updates }));
  const updateFormDataField = <K extends keyof FormData>(field: K, value: FormData[K]) => setFormDataState(prev => ({ ...prev, [field]: value }));

  const [showVideoFrameSelector, setShowVideoFrameSelector] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [isPosterGenerated, setIsPosterGenerated] = useState(false);
  const [showStyles, setShowStyles] = useState(false);

  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [hasPaidCredits, setHasPaidCredits] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [userEmail, setUserEmail] = useState<string>("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setUserEmail(user.email);
      setIsEmailVerified(true);
      fetchCredits();
    } else {
      const storedEmail = localStorage.getItem("posterTheMoment_verifiedEmail");
      if (storedEmail) {
        setUserEmail(storedEmail);
        setIsEmailVerified(true);
        fetchCredits();
      }
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isEmailVerified && userEmail) {
      fetchCredits();
    }
  }, [isEmailVerified, userEmail]);

  const fetchCredits = async (preservePaidStatus: boolean = false) => {
    try {
      const emailToUse = userEmail || localStorage.getItem("posterTheMoment_verifiedEmail");
      if (!emailToUse) return;
      const response = await apiRequest("GET", `/api/generation-credits?email=${encodeURIComponent(emailToUse)}`);
      if (response.ok) {
        const data = await response.json();
        const totalCredits = (data.freeCreditsRemaining || 0) + (data.paidCredits || 0);
        const userHasPaidCredits = (data.paidCredits || 0) > 0;
        setAvailableCredits(totalCredits);
        if (!preservePaidStatus) setHasPaidCredits(userHasPaidCredits);
      }
    } catch (e) {
      console.error("Error fetching credits:", e);
    }
  };

  const deductCredits = async () => {
    try {
      const useResponse = await apiRequest("POST", "/api/use-generation-credit", { email: userEmail });
      if (useResponse.ok) {
        fetchCredits(true);
        window.dispatchEvent(new CustomEvent("creditsUpdated"));
      } else {
        console.warn("Failed to deduct transformation credit, but transformation was successful");
      }
    } catch (e) {
      console.error("Error deducting credit:", e);
    }
  };

  const handleFileUpload = (imageDataUrl: string) => {
    setFormData({ uploadedImage: imageDataUrl });
    setShowStyles(true);
    trackEvent("Image", "upload_success");
  };

  const handleVideoUpload = async (videoFile: File) => {
    setFormData({ uploadedVideoPath: null, videoFrameData: null });
    setFormData({ uploadedVideo: videoFile });
    setShowVideoFrameSelector(true);
    setIsUploadingVideo(true);
    trackEvent("Video", "upload_started", videoFile.type);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result && userEmail) {
          const videoData = e.target.result as string;
          console.log(videoData, "videoData")
          const uploadResponse = await apiRequest("POST", "/api/upload-video", { videoData, filename: videoFile.name, email: userEmail });
          console.log(uploadResponse.ok, "uploadResponse")
          if (uploadResponse.ok) {
            const { videoPath } = await uploadResponse.json();
            setFormData({ uploadedVideoPath: videoPath });
            setIsUploadingVideo(false);
          } else {
            setIsUploadingVideo(false);
            toast({ title: "Video upload failed", description: "Please try again with a smaller video file.", variant: "destructive" });
          }
        }
      };
      reader.onerror = () => {
        setIsUploadingVideo(false);
        toast({ title: "Error reading video", description: "Please try uploading the video again.", variant: "destructive" });
      };
      reader.readAsDataURL(videoFile);
    } catch (e) {
      console.error("Error uploading video:", e);
      setIsUploadingVideo(false);
    }
  };

  const handleVideoFrameSelect = (frameData: SelectedVideoFrame) => {
    const frameDataWithPath = { ...frameData, videoPath: frameData.videoPath || formData.uploadedVideoPath || undefined };
    setFormData({ videoFrameData: frameDataWithPath, uploadedImage: frameData.frameDataUrl });
    setShowVideoFrameSelector(false);
    setShowStyles(true);
    trackEvent("Video", "frame_selected_success", `timestamp:${frameData.timestamp}s`);
  };

  const handleVideoFrameCancel = () => {
    setFormData({ uploadedVideo: null, uploadedVideoPath: null, videoFrameData: null });
    setShowVideoFrameSelector(false);
    setIsUploadingVideo(false);
    trackEvent("Video", "frame_selection_cancelled");
    try {
      window.history.back();
    } catch { }
  };

  const handleTextSave = (newTextOverlay: TextOverlay) => {
    const fixedPosition = { x: isNaN(newTextOverlay.position.x) ? 0 : newTextOverlay.position.x, y: isNaN(newTextOverlay.position.y) ? 0 : newTextOverlay.position.y };
    setTimeout(() => {
      setFormData({ textOverlay: { text: newTextOverlay.text, position: fixedPosition } });
      trackEvent("Customization", "text_saved");
    }, 50);
  };

  const handleTextCancel = () => {
    trackEvent("Customization", "text_cancelled");
  };

  const handleGeneratePoster = async (selectedStyle: StyleData) => {
    if (!formData.uploadedImage) {
      toast({ title: "No image selected", description: "Please upload an image first.", variant: "destructive" });
      return;
    }
    if (!userEmail) {
      toast({ title: "Email verification required", description: "Please verify your email to generate posters.", variant: "destructive" });
      return;
    }
    setShowStyles(false);
    try {
      const creditsResponse = await apiRequest("GET", `/api/generation-credits?email=${encodeURIComponent(userEmail)}`);
      if (!creditsResponse.ok) throw new Error("Failed to check generation credits");
      const creditsData = await creditsResponse.json();
      const totalCredits = creditsData.freeCreditsRemaining + creditsData.paidCredits;
      const hasPaid = creditsData.paidCredits > 0;
      setAvailableCredits(totalCredits);
      setHasPaidCredits(hasPaid);
      setIsGeneratingPoster(true);
    } catch (e) {
      console.error("Error checking credits:", e);
      toast({ title: "Error checking credits", description: "There was a problem checking your credits. Please try again.", variant: "destructive" });
      return;
    }

    trackEvent("Creation", "transform_attempt", selectedStyle?.name);
    console.log(selectedStyle.name, "selectedstyle")
    const startTime = performance.now();
    try {
      const constructedPrompt = constructPrompt(selectedStyle?.id, formData.selectedFeelings);
      const videoPathToUse = formData.videoFrameData?.videoPath || formData.uploadedVideoPath;
      const response = await apiRequest("POST", "/api/generate-gpt-image", {
        imageData: formData.uploadedImage,
        style: selectedStyle?.id,
        stylePrompt: constructedPrompt,
        email: userEmail,
        originalVideoPath: videoPathToUse,
        videoFrameTimestamp: formData.videoFrameData?.timestamp,
        hasVideoData: !!(formData.videoFrameData && videoPathToUse)
      });
      let data: any;
      try {
        const responseText = await response.text();
        if (responseText.trim().startsWith('<') || responseText.includes('<!DOCTYPE')) {
          throw new Error("The server is experiencing issues. Please try again in a moment.");
        }
        data = JSON.parse(responseText);
      } catch (jsonError: any) {
        if (jsonError instanceof Error && jsonError.message.includes("server is experiencing issues")) throw jsonError;
        throw new Error("Server returned an invalid response. Please try again.");
      }
      if (data && (data.posterUrl || data.previewUrl)) {
        const displayUrl = data.previewUrl || data.posterUrl;
        const fullUrl = import.meta.env.VITE_API_URL + displayUrl;
        setFormData({ uploadedImage: fullUrl });
        setIsPosterGenerated(true);
        const img = new Image();
        img.onload = () => {
          setTimeout(() => { setIsGeneratingPoster(false); fetchCredits(true); }, 600);
        };
        img.src = fullUrl;
        const processingTimeMs = performance.now() - startTime;
        trackPosterGeneration(selectedStyle?.id, selectedStyle?.name, true, Math.round(processingTimeMs));
        trackTiming("Artistic Transformation", "processing_time", Math.round(processingTimeMs), selectedStyle?.id);
        await deductCredits();
      }
    } catch (e: any) {
      console.error("Error generating poster:", e);
      let errorMessage = e instanceof Error ? e.message : "Failed to generate poster. Please try again.";
      let errorCategory = "general_failure";
      let toastTitle = "Transformation Failed";
      if (errorMessage.includes("flagged as sensitive") || errorMessage.includes("E005") || errorMessage.includes("serviceUnavailable")) {
        errorMessage = "Image flagged as sensitive, please try another";
        errorCategory = "sensitive_content";
        toastTitle = "Sensitive Content Detected";
        setFormData({ uploadedImage: null });
      }
      if (errorMessage.includes("request entity too large") || errorMessage.includes("413")) {
        errorMessage = "Your image file is too large. Please resize your image to under 8MB, or try a different photo.";
        errorCategory = "file_too_large";
        toastTitle = "Image Too Large";
        setFormData({ uploadedImage: null });
      }
      trackPosterGeneration(selectedStyle?.id, selectedStyle?.name, false);
      trackError("poster_transformation", `${errorCategory}: ${errorMessage.substring(0, 100)}`);
      toast({ title: toastTitle, description: errorMessage, variant: "destructive", duration: 5000 });
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const resetFormData = (style: StyleData) => {
    setFormDataState({
      uploadedImage: null,
      uploadedVideo: null,
      uploadedVideoPath: null,
      videoFrameData: null,
      selectedStyle: style,
      selectedFeelings: ["", "", ""],
      textOverlay: null,
    });
    setIsPosterGenerated(false);
    setShowStyles(false);
  };

  // Use the custom hook for order processing logic sdfsdf
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
    error: orderError,
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
    // Also support media passed via custom events (from wouter navigation)
    const imgListener = (e: any) => {
      try {
        const dataUrl = e.detail?.imageDataUrl as string | undefined;
        console.log(dataUrl, "dataUrl")
        if (dataUrl) handleFileUpload(dataUrl);
      } catch { }
    };
    const vidListener = (e: any) => {
      try {
        const fileId = e.detail?.fileId as string | undefined;
        if (fileId) {
          const file = videoFileStorage.get(fileId);
          console.log(file, "file from storage");
          if (file) {
            handleVideoUpload(file);
            // Clean up after retrieval
            videoFileStorage.delete(fileId);
          } else {
            console.error("Video file not found in storage for ID:", fileId);
          }
        }
      } catch (err) {
        console.error("Error handling video selection:", err);
      }
    };
    window.addEventListener("imageSelectedForCreate", imgListener as EventListener);
    window.addEventListener("videoSelectedForCreate", vidListener as EventListener);

    return () => {
      window.removeEventListener(
        "openCreditPurchaseModal",
        handleOpenCreditModal,
      );
      window.removeEventListener("openLoginModal", handleOpenLoginModal);
      window.removeEventListener("showWelcomeModal", handleShowWelcomeModal);
      window.removeEventListener("imageSelectedForCreate", imgListener as EventListener);
      window.removeEventListener("videoSelectedForCreate", vidListener as EventListener);
    };
  }, [handleFileUpload, handleVideoUpload]);

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
    const generatedPosterUrl = formData.uploadedImage;
    if (generatedPosterUrl && userEmail) {
      // Always open the sell poster modal - it will handle subscription checking internally
      setGeneratedPosterUrl(generatedPosterUrl);
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
  // Preview/transition state moved from ImageUploader
  const [containerHeight, setContainerHeight] = useState(0);
  const [generatedImageLoaded, setGeneratedImageLoaded] = useState(false);
  const [showVideoTransition, setShowVideoTransition] = useState(false);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Calculate and update container height based on viewport
  useEffect(() => {
    const calculateHeight = () => {
      if (isPosterGenerated) {
        const maxViewportHeight = window.innerHeight * 0.55;
        const maxWidth = isMobile ? window.innerWidth * 0.8 : window.innerWidth * 0.65;
        const heightBasedOnWidth = maxWidth / 0.707;
        const optimalHeight = Math.min(maxViewportHeight, heightBasedOnWidth);
        setContainerHeight(optimalHeight);
      } else {
        setContainerHeight(495);
      }
    };
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, [isMobile, isPosterGenerated]);

  // Reset image loaded state when generation starts
  useEffect(() => {
    if (isGeneratingPoster) {
      setGeneratedImageLoaded(false);
    }
  }, [isGeneratingPoster]);

  // Apply generated state once image is ready
  useEffect(() => {
    if (isPosterGenerated && !isGeneratingPoster && formData.uploadedImage) {
      const t = setTimeout(() => setGeneratedImageLoaded(true), 200);
      return () => clearTimeout(t);
    }
  }, [isPosterGenerated, isGeneratingPoster, formData.uploadedImage]);

  // Create video object URL for display and handle cleanup
  useEffect(() => {
    if (formData.uploadedVideo) {
      const url = URL.createObjectURL(formData.uploadedVideo);
      setVideoObjectUrl(url);
      setShowVideoTransition(true);
      return () => {
        URL.revokeObjectURL(url);
        setVideoObjectUrl(null);
      };
    } else {
      setShowVideoTransition(false);
      setVideoObjectUrl(null);
    }
  }, [formData.uploadedVideo]);

  // Keep showing video transition after generation for frame-perfect loop
  useEffect(() => {
    if (isPosterGenerated && formData.uploadedVideo && !isGeneratingPoster) {
      setShowVideoTransition(true);
    }
  }, [isPosterGenerated, formData.uploadedVideo, isGeneratingPoster]);

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
                          !formData.uploadedImage ? (
                            <ImageUploader
                              onImageUpload={handleFileUpload}
                              onVideoUpload={handleVideoUpload}
                              uploadedImage={formData.uploadedImage}
                            />
                          ) : (
                            <div className={`ImagePreview w-full mx-auto flex justify-center items-center  ${!isMobile ? 'mt-40' : ''}`} style={{ maxWidth: isPosterGenerated ? 'none' : '350px' }}>
                              <div
                                ref={containerRef}
                                className="relative mx-auto"
                                style={{
                                  height: containerHeight || 550,
                                  width: containerHeight ? containerHeight * 0.707 : 389,
                                  maxWidth: '95vw',
                                  transition: 'all 0.5s ease-in-out, box-shadow 1.2s ease-in-out',
                                  transform: 'scale(1)',
                                  boxShadow: isPosterGenerated && generatedImageLoaded ? '0 0 30px rgba(255,215,0,0.7)' : 'none'
                                }}
                              >
                                <div className="absolute inset-0 transition-opacity duration-500">
                                  <div
                                    className={`relative w-full h-full overflow-hidden rounded-lg`}
                                    style={{ border: isPosterGenerated ? '30px solid white' : 'none' }}
                                  >
                                    {showVideoTransition && videoObjectUrl && formData.uploadedVideo ? (
                                      <div className="relative w-full h-full">
                                        <video
                                          ref={videoRef}
                                          src={videoObjectUrl}
                                          className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${isGeneratingPoster ? 'opacity-60' : 'opacity-100'}`}
                                          autoPlay
                                          muted
                                          loop
                                          playsInline
                                          onTimeUpdate={() => {
                                            if (videoRef.current && formData.videoFrameData && isPosterGenerated && !isGeneratingPoster) {
                                              const currentTime = videoRef.current.currentTime;
                                              const targetTime = formData.videoFrameData.timestamp;
                                              const posterDisplayDuration = 3;
                                              const posterOverlay = document.getElementById('poster-overlay');
                                              if (posterOverlay) {
                                                const posterEndTime = targetTime + posterDisplayDuration;
                                                if (currentTime >= targetTime && currentTime < posterEndTime) {
                                                  if (posterOverlay.style.opacity !== '1') {
                                                    posterOverlay.style.opacity = '1';
                                                  }
                                                  if (Math.abs(currentTime - targetTime) < 0.1 && !videoRef.current.paused) {
                                                    videoRef.current.pause();
                                                    setTimeout(() => {
                                                      if (videoRef.current && !videoRef.current.ended) {
                                                        videoRef.current.play();
                                                      }
                                                    }, posterDisplayDuration * 1000);
                                                  }
                                                } else {
                                                  if (posterOverlay.style.opacity !== '0') {
                                                    posterOverlay.style.opacity = '0';
                                                  }
                                                }
                                              }
                                            }
                                          }}
                                        />
                                        {isPosterGenerated && formData.uploadedImage && (
                                          <img
                                            id="poster-overlay"
                                            src={formData.uploadedImage}
                                            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-0"
                                            alt="Generated poster at selected frame"
                                          />
                                        )}
                                      </div>
                                    ) : (
                                      <img
                                        src={formData.uploadedImage}
                                        className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${isGeneratingPoster ? 'opacity-40' : 'opacity-100'}`}
                                        alt="Your artistic poster"
                                        onLoad={() => setGeneratedImageLoaded(true)}
                                      />
                                    )}

                                    {isGeneratingPoster && (
                                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black bg-opacity-60 rounded-lg">
                                        <div className="animate-spin h-20 w-20 border-4 border-[#f1b917] border-t-transparent rounded-full shadow-lg mb-4"></div>
                                        <p className="text-white text-lg font-medium mt-2">Creating Your Masterpiece...</p>
                                        <p className="text-white text-sm opacity-80 mt-1">Do not navigate away from the page</p>
                                        <p className="text-white text-sm opacity-80 mt-1">1 - 2 minutes</p>
                                      </div>
                                    )}

                                    {isUploadingVideo && (
                                      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black bg-opacity-60 rounded-lg">
                                        <div className="animate-spin h-20 w-20 border-4 border-[#f1b917] border-t-transparent rounded-full shadow-lg mb-4"></div>
                                        <p className="text-white text-lg font-medium mt-2">Uploading Video...</p>
                                        <p className="text-white text-sm opacity-80 mt-1">This may take a moment on mobile connections</p>
                                      </div>
                                    )}

                                    {formData.textOverlay && formData.textOverlay.text && (
                                      <div
                                        className={`absolute pointer-events-none z-30 ${showTextTool ? 'opacity-50' : 'opacity-100'}`}
                                        style={{
                                          left: `${formData.textOverlay.position.x}px`,
                                          top: `${formData.textOverlay.position.y}px`
                                        }}
                                      >
                                        <span
                                          className="text-white text-2xl font-bold whitespace-nowrap"
                                          style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)', display: 'inline-block' }}
                                        >
                                          {formData.textOverlay.text}
                                        </span>
                                      </div>
                                    )}

                                    {formData.uploadedImage && showTextTool && (
                                      <TextOverlayTool
                                        containerRef={containerRef}
                                        onSave={(textOverlay) => {
                                          handleTextSave(textOverlay);
                                        }}
                                        onCancel={handleTextCancel}
                                        initialText={formData.textOverlay?.text || ''}
                                        initialPosition={formData.textOverlay?.position || { x: 0, y: 0 }}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        ) : (
                          formData.uploadedImage &&
                          step === "upload" &&
                          !isPosterGenerated &&
                          !isGeneratingPoster && (
                            <div className={`w-full ${isMobile ? '-mt-1' : 'mt-32 pt-12'}`}>
                              {/* Subheading for style selection - only show when styles are visible */}
                              {showStyles && (
                                <h3 className="text-white text-xl font-racing-sans text-center mb-4">
                                  Scroll to pick a print style
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
                        window.history.back();
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
                      create
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
                      create
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
                    onClick={() => { window.history.back(); }}
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

        {!isMobile ? <Footer showTopLine={true} /> : <BottomNavigation />}
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
        imageUrl={formData.uploadedImage}
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
