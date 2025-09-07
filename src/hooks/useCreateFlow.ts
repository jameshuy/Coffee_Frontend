import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import {
  trackEvent,
  trackPosterGeneration,
  trackTiming,
  trackError,
} from "@/lib/analytics";
import { constructPrompt } from "@/lib/utils";
import { StyleData } from "@/data";

// Type definitions
interface TextOverlay {
  text: string;
  position: { x: number; y: number };
}

interface SelectedVideoFrame {
  frameDataUrl: string;
  timestamp: number;
  videoDuration: number;
  videoPath?: string;
}

interface FormData {
  uploadedImage: string | null;
  uploadedVideo: File | null;
  uploadedVideoPath: string | null;
  videoFrameData: SelectedVideoFrame | null;
  selectedStyle: any;
  selectedFeelings: string[];
  textOverlay: TextOverlay | null;
}

export function useCreateFlow() {
  const { isAuthenticated, user } = useAuth();

  // Form data state
  const [formData, setFormData] = useState<FormData>({
    uploadedImage: null,
    uploadedVideo: null,
    uploadedVideoPath: null,
    videoFrameData: null,
    selectedStyle: null,
    selectedFeelings: ["", "", ""],
    textOverlay: null,
  });

  // UI state
  const [showVideoFrameSelector, setShowVideoFrameSelector] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [isPosterGenerated, setIsPosterGenerated] = useState(false);
  const [showStyles, setShowStyles] = useState(false);

  // Credits state
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [hasPaidCredits, setHasPaidCredits] = useState<boolean>(false);

  // Upload progress and error state
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // User email state
  const [userEmail, setUserEmail] = useState<string>("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // Initialize user email and fetch credits when authenticated
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

  // Fetch credits whenever email is verified or changes
  useEffect(() => {
    if (isEmailVerified && userEmail) {
      fetchCredits();
    }
  }, [isEmailVerified, userEmail]);

  // Function to fetch credits from the server
  const fetchCredits = async (preservePaidStatus: boolean = false) => {
    try {
      const emailToUse = userEmail || localStorage.getItem("posterTheMoment_verifiedEmail");
      if (!emailToUse) return;

      const response = await apiRequest(
        "GET",
        `/api/generation-credits?email=${encodeURIComponent(emailToUse)}`,
      );
      
      if (response.ok) {
        const data = await response.json();
        const totalCredits = (data.freeCreditsRemaining || 0) + (data.paidCredits || 0);
        const userHasPaidCredits = (data.paidCredits || 0) > 0;

        setAvailableCredits(totalCredits);
        
        if (!preservePaidStatus) {
          setHasPaidCredits(userHasPaidCredits);
        }
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
    }
  };

  // Function to deduct credits
  const deductCredits = async () => {
    try {
      const useResponse = await apiRequest("POST", "/api/use-generation-credit", {
        email: userEmail,
      });

      if (useResponse.ok) {
        fetchCredits(true);
        window.dispatchEvent(new CustomEvent("creditsUpdated"));
      } else {
        console.warn("Failed to deduct transformation credit, but transformation was successful");
      }
    } catch (error) {
      console.error("Error deducting credit:", error);
    }
  };

  // Handle image upload
  const handleFileUpload = (imageDataUrl: string) => {
    setFormData(prev => ({ ...prev, uploadedImage: imageDataUrl }));
    setShowStyles(true);
    trackEvent("Image", "upload_success");
  };

  // Handle video upload
  const handleVideoUpload = async (videoFile: File) => {
    setFormData(prev => ({ 
      ...prev, 
      uploadedVideoPath: null, 
      videoFrameData: null 
    }));
    
    setFormData(prev => ({ ...prev, uploadedVideo: videoFile }));
    setShowVideoFrameSelector(true);
    setIsUploadingVideo(true);

    trackEvent("Video", "upload_started", videoFile.type);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result && userEmail) {
          const videoData = e.target.result as string;
          
          const uploadResponse = await apiRequest("POST", "/api/upload-video", {
            videoData,
            filename: videoFile.name,
            email: userEmail
          });

          if (uploadResponse.ok) {
            const { videoPath } = await uploadResponse.json();
            setFormData(prev => ({ ...prev, uploadedVideoPath: videoPath }));
            setIsUploadingVideo(false);
          } else {
            setIsUploadingVideo(false);
            toast({
              title: "Video upload failed",
              description: "Please try again with a smaller video file.",
              variant: "destructive"
            });
          }
        }
      };
      
      reader.onerror = () => {
        setIsUploadingVideo(false);
        toast({
          title: "Error reading video",
          description: "Please try uploading the video again.",
          variant: "destructive"
        });
      };
      
      reader.readAsDataURL(videoFile);
    } catch (error) {
      console.error("Error uploading video:", error);
      setIsUploadingVideo(false);
    }
  };

  // Handle video frame selection
  const handleVideoFrameSelect = (frameData: SelectedVideoFrame) => {
    const frameDataWithPath = {
      ...frameData,
      videoPath: frameData.videoPath || formData.uploadedVideoPath || undefined
    };
    
    setFormData(prev => ({ 
      ...prev, 
      videoFrameData: frameDataWithPath,
      uploadedImage: frameData.frameDataUrl 
    }));
    
    setShowVideoFrameSelector(false);
    setShowStyles(true);

    trackEvent("Video", "frame_selected_success", `timestamp:${frameData.timestamp}s`);
  };

  // Handle video frame cancel
  const handleVideoFrameCancel = () => {
    setFormData(prev => ({ 
      ...prev, 
      uploadedVideo: null, 
      uploadedVideoPath: null, 
      videoFrameData: null 
    }));
    setShowVideoFrameSelector(false);
    setIsUploadingVideo(false);
    trackEvent("Video", "frame_selection_cancelled");
  };

  // Handle text overlay save
  const handleTextSave = (newTextOverlay: TextOverlay) => {
    const fixedPosition = {
      x: isNaN(newTextOverlay.position.x) ? 0 : newTextOverlay.position.x,
      y: isNaN(newTextOverlay.position.y) ? 0 : newTextOverlay.position.y,
    };

    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        textOverlay: {
          text: newTextOverlay.text,
          position: fixedPosition,
        }
      }));
      trackEvent("Customization", "text_saved");
    }, 50);
  };

  // Handle text overlay cancel
  const handleTextCancel = () => {
    trackEvent("Customization", "text_cancelled");
  };

  // Handle poster generation
  const handleGeneratePoster = async (selectedStyle: StyleData) => {
    if (!formData.uploadedImage) {
      toast({
        title: "No image selected",
        description: "Please upload an image first.",
        variant: "destructive",
      });
      return;
    }

    if (!userEmail) {
      toast({
        title: "Email verification required",
        description: "Please verify your email to generate posters.",
        variant: "destructive",
      });
      return;
    }

    setShowStyles(false);

    try {
      // Check user's credit balance
      const creditsResponse = await apiRequest(
        "GET",
        `/api/generation-credits?email=${encodeURIComponent(userEmail)}`,
      );
      
      if (!creditsResponse.ok) {
        throw new Error("Failed to check generation credits");
      }

      const creditsData = await creditsResponse.json();
      const totalCredits = creditsData.freeCreditsRemaining + creditsData.paidCredits;
      const hasPaidCredits = creditsData.paidCredits > 0;

      setAvailableCredits(totalCredits);
      setHasPaidCredits(hasPaidCredits);

      setIsGeneratingPoster(true);
    } catch (error) {
      console.error("Error checking credits:", error);
      toast({
        title: "Error checking credits",
        description: "There was a problem checking your credits. Please try again.",
        variant: "destructive",
      });
      return;
    }

    trackEvent("Creation", "transform_attempt", selectedStyle?.name);
    const startTime = performance.now();

    try {
      const constructedPrompt = constructPrompt(
        selectedStyle?.id,
        formData.selectedFeelings,
      );

      const videoPathToUse = formData.videoFrameData?.videoPath || formData.uploadedVideoPath;

      console.log(formData.uploadedImage, selectedStyle.id, constructedPrompt, userEmail, videoPathToUse, formData.videoFrameData?.timestamp, (formData.videoFrameData && videoPathToUse))
      const response = await apiRequest("POST", "/api/generate-gpt-image", {
        imageData: formData.uploadedImage,
        style: selectedStyle?.id,
        stylePrompt: constructedPrompt,
        email: userEmail,
        originalVideoPath: videoPathToUse,
        videoFrameTimestamp: formData.videoFrameData?.timestamp,
        hasVideoData: !!(formData.videoFrameData && videoPathToUse)
      });

      let data;
      try {
        const responseText = await response.text();
        
        if (responseText.trim().startsWith('<') || responseText.includes('<!DOCTYPE')) {
          throw new Error("The server is experiencing issues. Please try again in a moment.");
        }
        
        data = JSON.parse(responseText);
      } catch (jsonError) {
        if (jsonError instanceof Error && jsonError.message.includes("server is experiencing issues")) {
          throw jsonError;
        }
        throw new Error("Server returned an invalid response. Please try again.");
      }

      if (data && (data.posterUrl || data.previewUrl)) {
        const displayUrl = data.previewUrl || data.posterUrl;
        const fullUrl = window.location.origin + displayUrl;

        console.log(window.location.origin, "prefix", fullUrl, "FULL URL");
        setFormData(prev => ({ ...prev, uploadedImage: displayUrl }));
        setIsPosterGenerated(true);

        const img = new Image();
        img.onload = () => {
          setTimeout(() => {
            setIsGeneratingPoster(false);
            fetchCredits(true);
          }, 600);
        };
        img.src = fullUrl;

        const processingTimeMs = performance.now() - startTime;

        trackPosterGeneration(
          selectedStyle?.id,
          selectedStyle?.name,
          true,
          Math.round(processingTimeMs),
        );

        trackTiming(
          "Artistic Transformation",
          "processing_time",
          Math.round(processingTimeMs),
          selectedStyle?.id,
        );

        // Deduct credit
        await deductCredits();
      }
    } catch (error) {
      console.error("Error generating poster:", error);
      
      let errorMessage = error instanceof Error ? error.message : "Failed to generate poster. Please try again.";
      let errorCategory = "general_failure";
      let toastTitle = "Transformation Failed";

      if (errorMessage.includes("flagged as sensitive") || errorMessage.includes("E005") || errorMessage.includes("serviceUnavailable")) {
        errorMessage = "Image flagged as sensitive, please try another";
        errorCategory = "sensitive_content";
        toastTitle = "Sensitive Content Detected";
        setFormData(prev => ({ ...prev, uploadedImage: null }));
      }

      if (errorMessage.includes("request entity too large") || errorMessage.includes("413")) {
        errorMessage = "Your image file is too large. Please resize your image to under 8MB, or try a different photo.";
        errorCategory = "file_too_large";
        toastTitle = "Image Too Large";
        setFormData(prev => ({ ...prev, uploadedImage: null }));
      }

      trackPosterGeneration(selectedStyle?.id, selectedStyle?.name, false);
      trackError("poster_transformation", `${errorCategory}: ${errorMessage.substring(0, 100)}`);

      toast({
        title: toastTitle,
        description: errorMessage,
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  // Reset form data for new poster
  const resetFormData = (selectedStyle: StyleData) => {
    setFormData({
      uploadedImage: null,
      uploadedVideo: null,
      uploadedVideoPath: null,
      videoFrameData: null,
      selectedStyle: selectedStyle,
      selectedFeelings: ["", "", ""],
      textOverlay: null,
    });
    setIsPosterGenerated(false);
    setShowStyles(false);
  };

  // Update specific form data fields
  const updateFormData = (updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Update specific form data field
  const updateFormDataField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    // Form data
    formData,
    setFormData: updateFormData,
    updateFormDataField,
    
    // File upload handlers
    handleFileUpload,
    handleVideoUpload,
    handleVideoFrameSelect,
    handleVideoFrameCancel,
    
    // Text overlay handlers
    handleTextSave,
    handleTextCancel,
    
    // Poster generation
    handleGeneratePoster,
    
    // Credits
    credits: availableCredits,
    deductCredits,
    hasPaidCredits,
    
    // UI state
    showVideoFrameSelector,
    setShowVideoFrameSelector,
    isUploadingVideo,
    isGeneratingPoster,
    isPosterGenerated,
    showStyles,
    setShowStyles,
    
    // Progress and error
    uploadProgress,
    error,
    
    // User state
    userEmail,
    isEmailVerified,
    
    // Utility functions
    resetFormData,
    fetchCredits,
  };
}
