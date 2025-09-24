import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/Button";
import { X, Share2 } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string | null;
  shareContext?: 'catalogue' | 'dashboard' | 'generation';
  posterId?: string;
}

const ShareModal = ({ isOpen, onClose, imageUrl, shareContext = 'dashboard', posterId }: ShareModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [canUseNativeShare, setCanUseNativeShare] = useState(false);

  // Generate share text and URL based on context
  const getShareData = (): { text: string; url?: string } => {
    if (shareContext === 'catalogue' && posterId) {
      return {
        text: "Check out this poster for sale on coffeeandprints.com",
        url: `${window.location.origin}/catalogue?poster=${posterId}`
      };
    }

    // Default for dashboard/generation contexts - text only, no URL (private posters)
    return {
      text: "Check out this poster I created on coffeeandprints.com"
    };
  };

  // Check if the browser supports the Web Share API
  useEffect(() => {
    const checkShareSupport = () => {
      if (typeof navigator !== 'undefined' && 'share' in navigator) {
        setCanUseNativeShare(true);
      } else {
        setCanUseNativeShare(false);
      }
    };

    checkShareSupport();
  }, []);

  // Handle native sharing via Web Share API

  const handleNativeShare = async () => {
    if (!imageUrl) return;

    setIsProcessing(true);
    trackEvent("Share", "native_share_attempt");

    try {
      // Get processed share image with white border from server
      const response = await fetch('/api/share-image-with-border', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to process image for sharing');
      }

      const blob = await response.blob();

      // Create a File object from the blob
      const file = new File([blob], "poster-the-moment.png", { type: "image/png" });

      // Get context-specific share data
      const { text, url } = getShareData();

      // Check if we can share files
      const shareData: any = {
        text: text,
      };

      // Only add URL for public posters (catalogue context)
      if (url) {
        shareData.url = url;
      }

      // Add the file if the browser supports sharing files
      if (typeof navigator !== 'undefined' &&
        'canShare' in navigator &&
        navigator.canShare({ files: [file] })) {
        shareData.files = [file];
      }

      // Trigger native sharing
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "SHARE",
          ...shareData,
        }));
        return;
      }

      if (navigator.share) {
        await navigator.share(shareData)
      }
      trackEvent("Share", "native_share_success");

      // Close the modal after successful share
      onClose();
    } catch (error) {
      console.error("Error sharing:", error);
      trackEvent("Share", "native_share_error", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Instagram sharing
  const handleInstagramShare = async () => {
    if (!imageUrl) return;

    setIsProcessing(true);
    trackEvent("Share", "instagram_share_attempt");

    try {
      // For Instagram, we need to download the image first
      // This is a fallback for devices without native share support

      // Create a download URL using the direct download endpoint
      const downloadUrl = `${window.location.origin}/api/download-image?imageUrl=${encodeURIComponent(imageUrl)}`;

      // Create a link element and trigger the download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `poster-the-moment-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();

      // Display success message with instructions
      setTimeout(() => {
        trackEvent("Share", "instagram_download_success");
        alert("Image saved! Now open Instagram and select this image to share.");
      }, 2000);

      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        onClose();
      }, 5000);
    } catch (error) {
      console.error("Error preparing for Instagram share:", error);
      trackEvent("Share", "instagram_share_error", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle copying a link to the poster
  const handleCopyLink = async () => {
    if (!imageUrl) return;

    setIsProcessing(true);
    trackEvent("Share", "copy_link_attempt");

    try {
      // Get context-specific URL
      const { url } = getShareData();

      if (!url) {
        // No URL available for private posters
        alert("This poster is private and cannot be shared via link.");
        trackEvent("Share", "copy_link_private_poster");
        onClose();
        return;
      }

      await navigator.clipboard.writeText(url);

      trackEvent("Share", "copy_link_success");
      alert("Link copied to clipboard!");
      onClose();
    } catch (error) {
      console.error("Error copying link:", error);
      trackEvent("Share", "copy_link_error", error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4 pointer-events-auto">
      <div className="bg-black rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-800 pointer-events-auto relative">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl text-white" style={{ fontFamily: "'Racing Sans One', cursive" }}>Share this Poster</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          <div>
            <p className="text-gray-300 mb-4 text-center">
              Give us a follow on instagram: <a
                href="https://www.instagram.com/coffee_and_prints"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f1b917] hover:underline font-medium"
              >
                @coffee_and_prints
              </a>
            </p>

            {/* Removed the preview image as requested */}

            {/* Share button */}
            <div className="mt-4">
              <Button
                onClick={handleNativeShare}
                disabled={isProcessing}
                className="w-full bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 py-3"
              >
                {isProcessing ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-5 w-5" />
                    Share Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ShareModal;