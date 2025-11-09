import { useState, useEffect, useRef, useCallback } from "react";
import { apiRequest } from "@/lib/queryClient";
import FeedItem from "./FeedItem";

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
}

export default function FeedContent() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [allPosts, setAllPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [hasUserNavigated, setHasUserNavigated] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get container height for feed items
  // The container will fill the available space (accounting for Navigation and BottomNavigation)
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate initial height - use window height as fallback for first render
  const calculateInitialHeight = (): number => {
    if (typeof window !== 'undefined') {
      // Approximate navigation heights (will be corrected by ResizeObserver)
      // Navigation on Feed page is larger due to big heading: ~120-140px
      // BottomNavigation is ~70px on mobile (including safe area)
      const isMobile = window.innerWidth < 640;
      const estimatedNavHeight = isMobile ? 120 : 140;
      const estimatedBottomNavHeight = isMobile ? 70 : 0;
      const calculated = window.innerHeight - estimatedNavHeight - estimatedBottomNavHeight;
      // Ensure minimum height
      return Math.max(calculated, 400);
    }
    return 600;
  };

  const [itemHeight, setItemHeight] = useState(() => calculateInitialHeight());

  // Update item height based on container height
  useEffect(() => {
    const updateHeight = () => {
      // Try multiple strategies to get accurate height
      if (containerRef.current && containerRef.current.clientHeight > 0) {
        setItemHeight(containerRef.current.clientHeight);
        return;
      }

      // Try parent element (main from Feed.tsx)
      if (containerRef.current?.parentElement) {
        const parentHeight = containerRef.current.parentElement.clientHeight;
        if (parentHeight > 0) {
          setItemHeight(parentHeight);
          return;
        }
      }

      // Fallback: measure main element directly
      const mainElement = document.querySelector('main');
      if (mainElement && mainElement.clientHeight > 0) {
        setItemHeight(mainElement.clientHeight);
        return;
      }

      // Last resort: use window height calculation
      const calculated = calculateInitialHeight();
      if (calculated > 0) {
        setItemHeight(calculated);
      }
    };

    // Initial measurement - use multiple attempts to ensure layout is ready
    updateHeight();

    // Try again after layout is complete
    requestAnimationFrame(() => {
      updateHeight();
      // One more attempt after a short delay to catch any async layout
      setTimeout(updateHeight, 50);
    });

    // Update on resize
    const handleResize = () => {
      updateHeight();
    };
    window.addEventListener('resize', handleResize);

    // Use ResizeObserver for more accurate measurements
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          setItemHeight(height);
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Also observe parent if available
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  // Re-measure when posts are loaded (layout might change)
  useEffect(() => {
    if (allPosts.length > 0 && !isLoading) {
      // Wait a bit for layout to stabilize after posts render
      const timeoutId = setTimeout(() => {
        if (containerRef.current && containerRef.current.clientHeight > 0) {
          setItemHeight(containerRef.current.clientHeight);
        } else if (containerRef.current?.parentElement) {
          const height = containerRef.current.parentElement.clientHeight;
          if (height > 0) {
            setItemHeight(height);
          }
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [allPosts.length, isLoading]);
  // Fetch posts from API
  const fetchPosts = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      const response = await apiRequest('GET', `/api/feed?page=${page}`);

      if (response.ok) {
        const data = await response.json();
        const newPosts = data.posts || [];

        if (append) {
          // When appending, preserve current scroll position
          const currentScrollPosition = scrollContainerRef.current?.scrollTop || 0;
          setPosts(prev => [...prev, ...newPosts]);
          setAllPosts(prev => [...prev, ...newPosts]);

          // Restore scroll position after posts are added
          setTimeout(() => {
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = currentScrollPosition;
            }
          }, 0);
        } else {
          setPosts(newPosts);
          setAllPosts(newPosts);
        }

        setHasMore(data.hasMore || false);
        setCurrentPage(page);
      } else {
        setError('Failed to load feed posts');
      }
    } catch (err) {
      console.error('Error fetching feed posts:', err);
      setError('Unable to load feed posts');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Load posts on mount
  useEffect(() => {
    fetchPosts(1, false);
  }, []);

  // Snap to position function
  const snapToPosition = useCallback((index: number) => {
    if (!scrollContainerRef.current) return;

    setIsScrolling(true);
    const targetScrollTop = index * itemHeight;

    scrollContainerRef.current.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    });

    setTimeout(() => {
      setIsScrolling(false);
    }, 300);
  }, [itemHeight]);

  // Handle manual post selection (click)
  const handleSelectPost = useCallback((index: number) => {
    // Ensure index is within bounds and never allow going beyond available posts
    const clampedIndex = Math.max(0, Math.min(index, allPosts.length - 1));

    // Don't allow navigation if we're at the boundaries
    if (index < 0 || index >= allPosts.length) {
      console.log(`Navigation blocked: index ${index} is out of bounds (0 to ${allPosts.length - 1})`);
      return;
    }

    // Mark that user has navigated
    setHasUserNavigated(true);
    setCurrentIndex(clampedIndex);
    snapToPosition(clampedIndex);
  }, [snapToPosition, allPosts.length]);

  // Handle scroll with snap-to behavior
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isScrolling) return;

    const scrollTop = scrollContainerRef.current.scrollTop;
    const newIndex = Math.round(scrollTop / itemHeight);

    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < allPosts.length) {
      setCurrentIndex(newIndex);
    }
  }, [currentIndex, allPosts.length, isScrolling, itemHeight]);

  // Initialize scroll position only on first load, not when loading more or after user has navigated
  useEffect(() => {
    if (allPosts.length > 0 && currentIndex === 0 && !isLoadingMore && !hasUserNavigated) {
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 100);
    }
  }, [allPosts.length, hasUserNavigated]); // Only trigger on length change, not array reference change

  // Passive scroll handler - simplified for TikTok-style scrolling
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let scrollTimeout: NodeJS.Timeout;

    const onScroll = () => {
      if (isScrolling) return; // Skip during programmatic scrolling

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollTop = scrollContainer.scrollTop;
        const scrollHeight = scrollContainer.scrollHeight;
        const clientHeight = scrollContainer.clientHeight;

        // Each item is exactly itemHeight pixels tall
        const newIndex = Math.round(scrollTop / itemHeight);
        const clampedIndex = Math.max(0, Math.min(newIndex, allPosts.length - 1));

        if (clampedIndex !== currentIndex) {
          setCurrentIndex(clampedIndex);
          // Mark that user has navigated when they scroll beyond index 0
          if (clampedIndex > 0) {
            setHasUserNavigated(true);
          }
        }

        // Check if we're near the bottom and should load more
        if (scrollTop + clientHeight >= scrollHeight - itemHeight * 2 && hasMore && !isLoadingMore) {
          console.log(`Loading more posts at index ${clampedIndex}, current page: ${currentPage}`);
          fetchPosts(currentPage + 1, true);
        }
      }, 100);
    };

    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener('scroll', onScroll);
      clearTimeout(scrollTimeout);
    };
  }, [currentIndex, isScrolling, itemHeight, allPosts.length, hasMore, isLoadingMore, currentPage, fetchPosts]);

  if (isLoading) {
    return (
      <div className="w-full mt-8 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading feed...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full mt-8 flex flex-col items-center justify-center">
        <div className="text-red-400 text-lg mb-4">{error}</div>
        <button
          onClick={() => fetchPosts(1, false)}
          className="px-4 py-2 bg-[#f1b917] text-black rounded hover:bg-opacity-90 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (allPosts.length === 0) {
    return (
      <div className="w-full mt-8 flex items-center justify-center">
        <div className="text-gray-400 text-lg">No posts available yet</div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center feed-carousel-container">
      {/* Vertical carousel container - TikTok style */}
      <div className="relative mx-auto w-full sm:max-w-md">
        {/* Vertical scrollable container - show one item at a time */}
        <div
          ref={scrollContainerRef}
          className="w-full overflow-y-auto overflow-x-hidden relative no-scrollbar feed-scroll-container"
          style={{
            height: `${itemHeight}px`,
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <div className="space-y-0">
            {allPosts.map((post, index) => {
              const isCurrent = index === currentIndex;

              return (
                <div
                  key={`feed-item-${post.id}-${index}`}
                  className="w-full flex items-center justify-center"
                  style={{
                    height: `${itemHeight}px`,
                    scrollSnapAlign: 'start',
                    minHeight: `${itemHeight}px`,
                    maxHeight: `${itemHeight}px`
                  }}

                >
                  <FeedItem
                    post={post}
                    isVisible={isCurrent}
                    onPrevious={() => handleSelectPost(index - 1)}
                    onNext={() => handleSelectPost(index + 1)}
                    hasPrevious={index > 0}
                    hasNext={index < allPosts.length - 1}
                  />
                </div>
              );
            })}

            {/* Loading more indicator */}
            {isLoadingMore && (
              <div className="w-full h-16 flex items-center justify-center">
                <div className="text-gray-400">Loading more...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}