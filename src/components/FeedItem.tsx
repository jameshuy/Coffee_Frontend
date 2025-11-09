import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Heart, Share, ShoppingCart, ChevronUp, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LoginModal } from "@/components/LoginModal";
import ShareModal from "@/components/ShareModal";
import CatalogueImageModal from "@/components/CatalogueImageModal";
import { useLocation } from "wouter";

interface FeedPost {
  id: string;
  userId: string;
  originalPath: string;
  generatedPath: string;
  thumbnailPath?: string;
  originalVideoPath?: string;
  compressedVideoPath?: string;
  videoFrameTimestamp?: number;
  style: string;
  createdAt: string;
  username?: string;
  name?: string;

  totalSupply?: number;
  soldCount?: number;
  pricePerUnit?: number;
  likeCount?: number;
  hasLiked?: boolean;
}

interface FeedItemProps {
  post: FeedPost;
  isVisible: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

// Helper function to show poster for full duration
function showPosterForFullDuration(
  videoRef: HTMLVideoElement | null,
  posterOverlay: HTMLElement | null,
  isPosterShowing: React.MutableRefObject<boolean>,
  hasPausedForPoster: React.MutableRefObject<boolean>,
  posterTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>,
  onComplete: () => void
) {
  if (!videoRef || !posterOverlay) return;

  // Mark that we're showing the poster
  hasPausedForPoster.current = true;
  isPosterShowing.current = true;

  // Pause video and show poster
  videoRef.pause();
  videoRef.style.opacity = '0';
  posterOverlay.style.opacity = '1';

  // Clear any existing timeout
  if (posterTimeoutRef.current) {
    clearTimeout(posterTimeoutRef.current);
  }

  // After 3 seconds, hide poster and restart video
  posterTimeoutRef.current = setTimeout(() => {
    if (posterOverlay && videoRef) {
      posterOverlay.style.opacity = '0';

      setTimeout(() => {
        if (videoRef) {
          videoRef.style.opacity = '1';
          hasPausedForPoster.current = false;
          isPosterShowing.current = false;
          videoRef.currentTime = 0;
          videoRef.play().catch(console.error);
          onComplete();
        }
      }, 500);
    }
  }, 3000);
}

function FeedItem({ post, isVisible, onPrevious, onNext, hasPrevious, hasNext }: FeedItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showVideoTransition, setShowVideoTransition] = useState(false);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [hasLiked, setHasLiked] = useState(post.hasLiked || false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCatalogueModal, setShowCatalogueModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasPausedForPoster = useRef(false);
  const isPosterShowing = useRef(false);
  const posterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLike = useCallback(async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    try {
      const response = await apiRequest('POST', `/api/posters/${post.id}/like`);

      if (response.ok) {
        const data = await response.json();
        setLikeCount(data.likeCount);
        setHasLiked(data.hasLiked);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Error",
          description: errorData.error || "Failed to update like status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast({
        title: "Error",
        description: "Unable to like post",
        variant: "destructive",
      });
    }
  }, [user, post.id, toast]);

  const handleShare = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const handleCatalogue = useCallback(() => {
    // Navigate to catalogue page with query param to open modal
    setLocation(`/catalogue?showPoster=${post.id}`);
  }, [post.id, setLocation]);

  // Check if video file exists and setup object URL
  useEffect(() => {
    if ((post.originalVideoPath || post.compressedVideoPath) && typeof post.videoFrameTimestamp === 'number') {
      // Prefer compressed video if available, fallback to original
      const videoPath = post.compressedVideoPath || post.originalVideoPath;

      fetch(`${import.meta.env.VITE_API_URL}/api/storage-image/${videoPath}`, { method: 'HEAD' })
        .then(response => {
          if (response.ok) {
            setVideoObjectUrl(`${import.meta.env.VITE_API_URL}/api/storage-image/${videoPath}`);
            setShowVideoTransition(true);
          } else {
            setVideoObjectUrl(null);
            setShowVideoTransition(false);
          }
        })
        .catch(() => {
          setVideoObjectUrl(null);
          setShowVideoTransition(false);
        });
    } else {
      setVideoObjectUrl(null);
      setShowVideoTransition(false);
    }
  }, [post.originalVideoPath, post.compressedVideoPath, post.videoFrameTimestamp]);

  // Handle video play/pause based on visibility
  useEffect(() => {
    if (videoRef.current && showVideoTransition) {
      if (isVisible) {
        hasPausedForPoster.current = false; // Reset flag when video becomes visible
        isPosterShowing.current = false; // Reset poster showing flag
        videoRef.current.currentTime = 0; // Reset to start
        videoRef.current.play().catch(console.error);
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0; // Reset when not visible
        hasPausedForPoster.current = false; // Reset flag
        isPosterShowing.current = false; // Reset poster showing flag

        // Clear any pending poster timeout
        if (posterTimeoutRef.current) {
          clearTimeout(posterTimeoutRef.current);
          posterTimeoutRef.current = null;
        }

        // Reset poster overlay
        const posterOverlay = document.getElementById(`poster-overlay-${post.id}`);
        if (posterOverlay) {
          posterOverlay.style.opacity = '0';
        }

        // Reset video opacity
        videoRef.current.style.opacity = '1';
      }
    }
  }, [isVisible, showVideoTransition, post.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (posterTimeoutRef.current) {
        clearTimeout(posterTimeoutRef.current);
      }
    };
  }, []);

  // Match landing page slideshow dimensions exactly
  const containerClasses = "w-full sm:w-full sm:max-w-[350px] relative";
  const aspectRatio = { aspectRatio: '1/1.414' };

  return (
    <div className="flex items-center justify-center w-full mb-8 relative">
      <div className="flex items-center gap-2 w-full sm:max-w-[600px]">
        {/* Left navigation arrow */}
        <div className="flex flex-col gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrevious?.();
            }}
            disabled={!hasPrevious}
            className={`bg-gray-800/80 p-2 rounded-full transition-colors ${hasPrevious ? 'hover:bg-gray-700' : 'opacity-50 cursor-not-allowed'
              }`}
            aria-label="Previous post"
          >
            <ChevronUp size={20} className="text-gray-300" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext?.();
            }}
            disabled={!hasNext}
            className={`bg-gray-800/80 p-2 rounded-full transition-colors ${hasNext ? 'hover:bg-gray-700' : 'opacity-50 cursor-not-allowed'
              }`}
            aria-label="Next post"
          >
            <ChevronDown size={20} className="text-gray-300" />
          </button>
        </div>

        {/* Main content container */}
        <div className="flex flex-col items-center flex-1">
          {/* Poster name above thumbnail */}
          {post.name && (
            <h2 className="text-white text-lg font-semibold mb-3 text-center">
              {post.name}
            </h2>
          )}

          {/* Video transition or static poster */}
          <div className={containerClasses} style={aspectRatio}>
            <div className="w-full h-full bg-white p-[18px] flex items-center justify-center">
              {showVideoTransition && videoObjectUrl && post.videoFrameTimestamp !== undefined ? (
                <div className="relative w-full h-full">
                  {/* Base video that loops */}
                  <video
                    ref={videoRef}
                    src={videoObjectUrl}
                    className="w-full h-full object-contain transition-opacity duration-500"
                    autoPlay={isVisible}
                    muted
                    playsInline
                    onLoadedData={() => {
                      setIsLoading(false);
                      // Check if frame timestamp is beyond video duration
                      if (videoRef.current && typeof post.videoFrameTimestamp === 'number') {
                        const videoDuration = videoRef.current.duration;
                        const targetTime = post.videoFrameTimestamp;
                        if (targetTime >= videoDuration) {
                          console.log(`⚠️ Frame timestamp (${targetTime}s) is beyond video duration (${videoDuration}s)`);
                        }
                      }
                    }}
                    onError={() => setIsLoading(false)}
                    onTimeUpdate={() => {
                      if (!videoRef.current || typeof post.videoFrameTimestamp !== 'number') return;

                      // Don't process if poster is currently showing
                      if (isPosterShowing.current) return;

                      const currentTime = videoRef.current.currentTime;
                      const targetTime = post.videoFrameTimestamp;
                      const posterDisplayDuration = 3;

                      const posterOverlay = document.getElementById(`poster-overlay-${post.id}`);
                      if (!posterOverlay) {
                        console.log(`❌ Poster overlay not found for ${post.id}`);
                        return;
                      }

                      // Check if we've reached the target timestamp and haven't already paused
                      if (currentTime >= targetTime && !hasPausedForPoster.current && !videoRef.current.paused) {
                        console.log(`🎬 Poster fade-in at ${targetTime}s for 3 seconds`);
                        showPosterForFullDuration(
                          videoRef.current,
                          posterOverlay,
                          isPosterShowing,
                          hasPausedForPoster,
                          posterTimeoutRef,
                          () => console.log(`🎬 Poster cycle complete`)
                        );
                      }

                      // Also check if we're near the end and should prepare for poster display
                      if (videoRef.current.duration &&
                        currentTime >= videoRef.current.duration - 0.5 &&
                        targetTime >= videoRef.current.duration - 0.5 &&
                        !hasPausedForPoster.current) {
                        // Frame is selected at or near video end - prepare to show poster when video ends
                        console.log(`🎬 Frame near end detected - will show poster on video end`);
                      }
                    }}
                    onEnded={() => {
                      // When video ends naturally, check if we've shown the poster
                      if (videoRef.current && !hasPausedForPoster.current && typeof post.videoFrameTimestamp === 'number') {
                        // If we haven't shown the poster yet (frame is at/after video end), show it now
                        const posterOverlay = document.getElementById(`poster-overlay-${post.id}`);
                        if (posterOverlay) {
                          console.log(`🎬 Video ended - showing poster for full duration`);
                          showPosterForFullDuration(
                            videoRef.current,
                            posterOverlay,
                            isPosterShowing,
                            hasPausedForPoster,
                            posterTimeoutRef,
                            () => console.log(`🎬 Poster cycle complete after video end`)
                          );
                        }
                      } else if (videoRef.current) {
                        // Normal restart without poster
                        hasPausedForPoster.current = false;
                        videoRef.current.currentTime = 0;
                        videoRef.current.play().catch(console.error);
                      }
                    }}
                  />

                  {/* Poster overlay that appears at selected frame - use thumbnail for faster loading */}
                  <img
                    id={`poster-overlay-${post.id}`}
                    src={`${import.meta.env.VITE_API_URL}/api/storage-image/${post.thumbnailPath || post.generatedPath}`}
                    className="absolute inset-0 w-full h-full object-contain transition-opacity duration-500 opacity-0"
                    alt="Generated poster at selected frame"
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                  />
                </div>
              ) : (
                // Static poster display - use thumbnail for faster loading
                <img
                  src={`${import.meta.env.VITE_API_URL}/api/storage-image/${post.thumbnailPath || post.generatedPath}`}
                  className="w-full h-full object-contain"
                  alt="Generated poster"
                  onLoad={() => setIsLoading(false)}
                  onError={() => setIsLoading(false)}
                />
              )}

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="text-white text-sm">Loading...</div>
                </div>
              )}
            </div>
          </div>

          {/* Creator name and price below poster - single line */}
          <div className="w-full sm:max-w-[350px] mt-2">
            <div className="flex items-center justify-between">
              {/* Creator name - left */}
              <div>
                {post.username && (
                  <p className="text-white font-medium text-sm">
                    @{post.username}
                  </p>
                )}
              </div>

              {/* Edition and price - right */}
              <div className="flex items-center gap-2">
                {/* Edition number (all posters are limited editions) */}
                {post.soldCount !== undefined && post.totalSupply && (
                  <p className="text-gray-300 text-sm">
                    #{post.soldCount + 1}/{post.totalSupply}
                  </p>
                )}

                {/* Price */}
                <p className="text-gray-300 text-sm font-medium">
                  CHF {(post.pricePerUnit || 29.95).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Like, Share and Catalogue buttons - right side */}
        <div className="flex flex-col gap-2">
          {/* Like button with count inside */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLike();
            }}
            className="bg-gray-800/80 p-2 rounded-full hover:bg-gray-700 transition-colors relative"
            aria-label={hasLiked ? "Unlike" : "Like"}
          >
            <Heart
              size={20}
              className={hasLiked ? "text-red-500 fill-red-500" : "text-gray-300"}
            />
          </button>

          {/* Catalogue button */}
          <button
            onClick={handleCatalogue}
            className="bg-gray-800/80 p-2 rounded-full hover:bg-gray-700 transition-colors"
            aria-label="View in catalogue"
          >
            <ShoppingCart size={20} className="text-gray-300" />
          </button>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        open={showLoginModal}
        onOpenChange={(open) => {
          setShowLoginModal(open);
          if (!open && user) {
            // If modal closed and user is now logged in, retry the like
            handleLike();
          }
        }}
      />

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          imageUrl={`${import.meta.env.VITE_API_URL}/api/storage-image/${post.generatedPath}`}
          shareContext="catalogue"
          posterId={post.id}
        />
      )}

      {/* Catalogue Modal */}
      {showCatalogueModal && (
        <CatalogueImageModal
          isOpen={showCatalogueModal}
          onClose={() => setShowCatalogueModal(false)}
          imageUrl={`${import.meta.env.VITE_API_URL}/api/storage-image/${post.generatedPath}`}
          style={post.style}
          id={post.id}
          username={post.username}
          totalSupply={post.totalSupply}
          soldCount={post.soldCount}
          pricePerUnit={post.pricePerUnit}
          remainingSupply={post.totalSupply ? post.totalSupply - (post.soldCount || 0) : undefined}
          isAvailable={post.totalSupply !== undefined && (post.soldCount || 0) < post.totalSupply}
        />
      )}
    </div>
  );
}

export default memo(FeedItem);