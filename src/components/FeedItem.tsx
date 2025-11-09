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
  containerHeight?: number;
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

function FeedItem({ post, isVisible, onPrevious, onNext, hasPrevious, hasNext, containerHeight }: FeedItemProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showVideoTransition, setShowVideoTransition] = useState(false);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const [likeCount, setLikeCount] = useState(post.likeCount || 0);
  const [hasLiked, setHasLiked] = useState(post.hasLiked || false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCatalogueModal, setShowCatalogueModal] = useState(false);
  const [imageBounds, setImageBounds] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasPausedForPoster = useRef(false);
  const isPosterShowing = useRef(false);
  const posterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Calculate actual image/video bounds when using object-contain
  const calculateImageBounds = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    // Get the media element (video or image)
    const videoElement = videoRef.current;
    const imageElement = imageRef.current;

    let naturalWidth = 0;
    let naturalHeight = 0;

    if (videoElement) {
      naturalWidth = videoElement.videoWidth || 0;
      naturalHeight = videoElement.videoHeight || 0;
    } else if (imageElement) {
      naturalWidth = imageElement.naturalWidth || 0;
      naturalHeight = imageElement.naturalHeight || 0;
    }

    if (naturalWidth === 0 || naturalHeight === 0) return;

    // Calculate aspect ratios
    const containerAspect = containerWidth / containerHeight;
    const mediaAspect = naturalWidth / naturalHeight;

    let renderedWidth: number;
    let renderedHeight: number;
    let offsetLeft: number;
    let offsetTop: number;

    // Calculate rendered size and position for object-contain
    if (mediaAspect > containerAspect) {
      // Media is wider - fit to width
      renderedWidth = containerWidth;
      renderedHeight = containerWidth / mediaAspect;
      offsetLeft = 0;
      offsetTop = (containerHeight - renderedHeight) / 2;
    } else {
      // Media is taller - fit to height
      renderedWidth = containerHeight * mediaAspect;
      renderedHeight = containerHeight;
      offsetLeft = (containerWidth - renderedWidth) / 2;
      offsetTop = 0;
    }

    setImageBounds({
      left: offsetLeft,
      top: offsetTop,
      width: renderedWidth,
      height: renderedHeight,
    });
  }, []);

  // Recalculate bounds when media loads or container resizes
  useEffect(() => {
    const updateBounds = () => {
      // Small delay to ensure layout is complete
      setTimeout(calculateImageBounds, 50);
    };

    if (videoRef.current) {
      videoRef.current.addEventListener('loadedmetadata', updateBounds);
      videoRef.current.addEventListener('loadeddata', updateBounds);
    }
    if (imageRef.current) {
      imageRef.current.addEventListener('load', updateBounds);
    }

    const resizeObserver = new ResizeObserver(updateBounds);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Initial calculation
    updateBounds();

    return () => {
      if (videoRef.current) {
        videoRef.current.removeEventListener('loadedmetadata', updateBounds);
        videoRef.current.removeEventListener('loadeddata', updateBounds);
      }
      if (imageRef.current) {
        imageRef.current.removeEventListener('load', updateBounds);
      }
      resizeObserver.disconnect();
    };
  }, [calculateImageBounds, showVideoTransition]);

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

  return (
    <div className="flex flex-col items-center w-full h-full relative px-4 py-2">
      {/* Poster name above thumbnail */}
      {post.name && (
        <h2 className="text-white text-lg font-semibold mb-2 text-center flex-shrink-0">
          {post.name}
        </h2>
      )}

      {/* Video transition or static poster */}
      <div className="w-full relative flex-1 min-h-0 flex items-center justify-center">
        <div
          ref={containerRef}
          className="w-full h-full max-w-full max-h-full bg-white p-[18px] flex items-center justify-center relative"
        >
          {showVideoTransition && videoObjectUrl && post.videoFrameTimestamp !== undefined ? (
            <div className="relative w-full h-full">
              {/* Base video that loops */}
              <div className="relative w-full h-full">
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
                {imageBounds && (
                  <>
                    <div
                      className="absolute z-10"
                      style={{
                        left: `${imageBounds.left + 16}px`,
                        bottom: `${(containerRef.current?.getBoundingClientRect().height || 0) - imageBounds.top - imageBounds.height + 16}px`,
                      }}
                    >
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
                        <div className="text-white">
                          {post.username && (
                            <p className="font-racing-sans text-lg leading-tight">@{post.username}</p>
                          )}
                          {post.name && (
                            <p className="text-sm text-gray-200 mt-1 leading-tight">{post.name}</p>
                          )}
                          {post.totalSupply !== undefined && (
                            <p className="text-xs text-gray-300 mt-2 leading-tight">
                              #{(post.soldCount || 0) + 1}/{post.totalSupply}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Like and ShoppingCart buttons - bottom right overlay on video */}
                    <div
                      className="absolute flex flex-row gap-2 z-10"
                      style={{
                        right: `${(containerRef.current?.getBoundingClientRect().width || 0) - imageBounds.left - imageBounds.width + 16}px`,
                        bottom: `${(containerRef.current?.getBoundingClientRect().height || 0) - imageBounds.top - imageBounds.height + 16}px`,
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike();
                        }}
                        className="bg-gray-800/80 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700 transition-colors relative shadow-lg"
                        aria-label={hasLiked ? "Unlike" : "Like"}
                      >
                        <Heart
                          size={20}
                          className={hasLiked ? "text-red-500 fill-red-500" : "text-gray-300"}
                        />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCatalogue();
                        }}
                        className="bg-gray-800/80 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700 transition-colors shadow-lg"
                        aria-label="View in catalogue"
                      >
                        <ShoppingCart size={20} className="text-gray-300" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Poster overlay that appears at selected frame - use thumbnail for faster loading */}
              <div className="absolute inset-0 pointer-events-none">
                <img
                  id={`poster-overlay-${post.id}`}
                  src={`${import.meta.env.VITE_API_URL}/api/storage-image/${post.thumbnailPath || post.generatedPath}`}
                  className="w-full h-full object-contain transition-opacity duration-500 opacity-0 pointer-events-none"
                  alt="Generated poster at selected frame"
                  onLoad={() => setIsLoading(false)}
                  onError={() => setIsLoading(false)}
                />
                {imageBounds && (
                  <>
                    <div
                      className="absolute z-10 pointer-events-auto"
                      style={{
                        left: `${imageBounds.left + 16}px`,
                        bottom: `${(containerRef.current?.getBoundingClientRect().height || 0) - imageBounds.top - imageBounds.height + 16}px`,
                      }}
                    >
                      <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
                        <div className="text-white">
                          {post.username && (
                            <p className="font-racing-sans text-lg leading-tight">@{post.username}</p>
                          )}
                          {post.name && (
                            <p className="text-sm text-gray-200 mt-1 leading-tight">{post.name}</p>
                          )}
                          {post.totalSupply !== undefined && (
                            <p className="text-xs text-gray-300 mt-2 leading-tight">
                              #{(post.soldCount || 0) + 1}/{post.totalSupply}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Like and ShoppingCart buttons - bottom right overlay on poster image */}
                    <div
                      className="absolute flex flex-row gap-2 z-10 pointer-events-auto"
                      style={{
                        right: `${(containerRef.current?.getBoundingClientRect().width || 0) - imageBounds.left - imageBounds.width + 16}px`,
                        bottom: `${(containerRef.current?.getBoundingClientRect().height || 0) - imageBounds.top - imageBounds.height + 16}px`,
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike();
                        }}
                        className="bg-gray-800/80 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700 transition-colors relative shadow-lg"
                        aria-label={hasLiked ? "Unlike" : "Like"}
                      >
                        <Heart
                          size={20}
                          className={hasLiked ? "text-red-500 fill-red-500" : "text-gray-300"}
                        />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCatalogue();
                        }}
                        className="bg-gray-800/80 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700 transition-colors shadow-lg"
                        aria-label="View in catalogue"
                      >
                        <ShoppingCart size={20} className="text-gray-300" />
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          ) : (
            // Static poster display - use thumbnail for faster loading
            <div className="relative w-full h-full">
              <img
                ref={imageRef}
                src={`${import.meta.env.VITE_API_URL}/api/storage-image/${post.thumbnailPath || post.generatedPath}`}
                className="w-full h-full object-contain"
                alt="Generated poster"
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
              />
              {/* Poster data - bottom left overlay on image - positioned on actual image */}
              {imageBounds && (
                <>
                  <div
                    className="absolute z-10"
                    style={{
                      left: `${imageBounds.left + 16}px`,
                      bottom: `${(containerRef.current?.getBoundingClientRect().height || 0) - imageBounds.top - imageBounds.height + 16}px`,
                    }}
                  >
                    <div className="bg-black/60 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
                      <div className="text-white">
                        {post.username && (
                          <p className="font-racing-sans text-lg leading-tight">@{post.username}</p>
                        )}
                        {post.name && (
                          <p className="text-sm text-gray-200 mt-1 leading-tight">{post.name}</p>
                        )}
                        {post.totalSupply !== undefined && (
                          <p className="text-xs text-gray-300 mt-2 leading-tight">
                            #{(post.soldCount || 0) + 1}/{post.totalSupply}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Like and ShoppingCart buttons - bottom right overlay on image */}
                  <div
                    className="absolute flex flex-row gap-2 z-10"
                    style={{
                      right: `${(containerRef.current?.getBoundingClientRect().width || 0) - imageBounds.left - imageBounds.width + 16}px`,
                      bottom: `${(containerRef.current?.getBoundingClientRect().height || 0) - imageBounds.top - imageBounds.height + 16}px`,
                    }}
                  >
                    {/* Like button with count inside */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLike();
                      }}
                      className="bg-gray-800/80 backdrop-blur-sm p-2 rounded-full hover:bg-gray-700 transition-colors relative shadow-lg"
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
                </>
              )}
            </div>
          )}

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <div className="text-white text-sm">Loading...</div>
            </div>
          )}
        </div>
      </div>

      {/* Price below poster */}
      <div className="w-full mt-2 flex-shrink-0 flex justify-center">
        <p className="text-gray-300 text-sm font-medium">
          CHF {(post.pricePerUnit || 29.95).toFixed(2)}
        </p>
      </div >

      {/* Login Modal */}
      < LoginModal
        open={showLoginModal}
        onOpenChange={(open) => {
          setShowLoginModal(open);
          if (!open && user) {
            // If modal closed and user is now logged in, retry the like
            handleLike();
          }
        }
        }
      />

      {/* Share Modal */}
      {
        showShareModal && (
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            imageUrl={`${import.meta.env.VITE_API_URL}/api/storage-image/${post.generatedPath}`}
            shareContext="catalogue"
            posterId={post.id}
          />
        )
      }

      {/* Catalogue Modal */}
      {
        showCatalogueModal && (
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
        )
      }
    </div >
  );
}

export default memo(FeedItem);