import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import CatalogueImageModal from "@/components/CatalogueImageModal";
import { Plus, Minus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PublicImage {
  id: string;
  generatedPath: string;
  style: string;
  createdAt: string;
  imageUrl: string;
  fullImageUrl?: string;
  usingThumbnail?: boolean;
  username?: string;
  name?: string; // Poster name

  totalSupply?: number;
  soldCount?: number;
  pricePerUnit?: number;
  remainingSupply?: number;
  isAvailable?: boolean;
  momentLink?: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface PublicImagesResponse {
  images: PublicImage[];
  pagination: PaginationInfo;
}

interface CatalogueGridProps {
  searchQuery?: string;
  onOpenCart?: () => void;
  onShare?: (imageUrl: string, posterId?: string) => void;
  targetPosterId?: string | null;
  onPosterOpened?: () => void;
  isAdminView?: boolean;
}

function CatalogueGrid({ searchQuery, onOpenCart, onShare, targetPosterId, onPosterOpened, isAdminView = false }: CatalogueGridProps) {
  const [selectedImage, setSelectedImage] = useState<PublicImage | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const limit = 12; // Number of images per page
  const { toast } = useToast();
  const [localEditions, setLocalEditions] = useState<{ [key: string]: number }>({});

  // Use infinite query instead of regular query for pagination
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery<PublicImagesResponse>({
    queryKey: [isAdminView ? '/api/admin/catalogue' : '/api/public-images', searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
        const endpoint = isAdminView ? '/api/admin/catalogue' : '/api/public-images';
        const response = await apiRequest("GET", `${endpoint}?limit=${limit}&offset=${pageParam}${searchParam}`);
        const result = await response.json();
        // Ensure the response has the expected structure
        return {
          images: Array.isArray(result?.images) ? result.images : [],
          pagination: result?.pagination || { total: 0, limit: limit, offset: pageParam, hasMore: false }
        };
      } catch (error) {
        console.error('Error fetching public images:', error);
        return {
          images: [],
          pagination: { total: 0, limit: limit, offset: pageParam, hasMore: false }
        };
      }
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || !lastPage.pagination || !lastPage.pagination.hasMore) return undefined;
      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
    initialPageParam: 0,
    retry: 2,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Safe data extraction with comprehensive fallbacks
  const safeData = data || { pages: [] };
  const safePages = (safeData.pages && Array.isArray(safeData.pages)) ? safeData.pages : [];
  const allImages = useMemo(
    () => safePages.flatMap(page => (page && page.images && Array.isArray(page.images)) ? page.images : []),
    [safePages]
  );

  // Mutation for updating edition numbers (admin only)
  const updateEditionMutation = useMutation({
    mutationFn: async ({ imageId, soldCount }: { imageId: string; soldCount: number }) => {
      const response = await apiRequest('PATCH', `/api/admin/images/${imageId}/edition`, { soldCount });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update edition');
      }
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update local state immediately
      setLocalEditions(prev => ({ ...prev, [variables.imageId]: variables.soldCount }));
      
      // Invalidate the catalogue query to refresh from server
      queryClient.invalidateQueries({ queryKey: ['/api/admin/catalogue'] });
      
      toast({
        title: "Edition updated",
        description: `Edition #${data.editionNumber} will be sold next`,
        duration: 2000,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  // Function to handle edition updates
  const handleEditionUpdate = useCallback((imageId: string, currentSoldCount: number, delta: number) => {
    const newSoldCount = Math.max(0, currentSoldCount + delta);
    updateEditionMutation.mutate({ imageId, soldCount: newSoldCount });
  }, [updateEditionMutation]);

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (!entries || !Array.isArray(entries) || entries.length === 0) return;
      const [entry] = entries;
      if (entry && entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  // Set up the intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    });

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [handleObserver]);

  // URL helpers to keep history updates consistent
  const setUrlParam = useCallback((key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url.toString());
  }, []);

  const removeUrlParam = useCallback((key: string) => {
    const url = new URL(window.location.href);
    url.searchParams.delete(key);
    window.history.pushState({}, '', url.toString());
  }, []);

  // Open image in modal
  const openImageModal = useCallback((image: PublicImage) => {
    setSelectedImage(image);
    setUrlParam('poster', image.id);
  }, [setUrlParam]);

  // Close modal
  const closeImageModal = useCallback(() => {
    setSelectedImage(null);
    removeUrlParam('poster');
  }, [removeUrlParam]);
  
  // Navigate to previous image in modal
  const goToPreviousImage = useCallback(() => {
    if (!selectedImage) return;
    
    const currentIndex = allImages.findIndex(img => img.id === selectedImage.id);
    
    if (currentIndex > 0) {
      const prevImage = allImages[currentIndex - 1];
      setSelectedImage(prevImage);
      setUrlParam('poster', prevImage.id);
    }
  }, [allImages, selectedImage, setUrlParam]);
  
  // Navigate to next image in modal
  const goToNextImage = useCallback(() => {
    if (!selectedImage) return;
    
    const currentIndex = allImages.findIndex(img => img.id === selectedImage.id);
    
    if (currentIndex >= 0 && currentIndex < allImages.length - 1) {
      const nextImage = allImages[currentIndex + 1];
      setSelectedImage(nextImage);
      setUrlParam('poster', nextImage.id);
    }
  }, [allImages, selectedImage, setUrlParam]);

  // Auto-open poster from URL parameter
  useEffect(() => {
    if (!targetPosterId) return;

    const targetImage = allImages.find(img => img.id === targetPosterId);
    
    if (targetImage) {
      setSelectedImage(targetImage);
      onPosterOpened?.();
    } else if (data) {
      // If poster not found in current pages, try to fetch it directly
      apiRequest('GET', `/api/images/${targetPosterId}/availability`)
        .then(response => response.json())
        .then(posterData => {
          if (posterData && posterData.id) {
            // Transform the poster data to match PublicImage interface
            const publicImage: PublicImage = {
              id: posterData.id,
              generatedPath: posterData.generatedPath || '',
              style: posterData.style || '',
              createdAt: posterData.createdAt || new Date().toISOString(),
              imageUrl: posterData.imageUrl || '',
              fullImageUrl: posterData.fullImageUrl,
              usingThumbnail: posterData.usingThumbnail,
              username: posterData.username,
              name: posterData.name,

              totalSupply: posterData.totalSupply,
              soldCount: posterData.soldCount,
              pricePerUnit: posterData.pricePerUnit,
              remainingSupply: posterData.remainingSupply,
              isAvailable: posterData.isAvailable
            };
            setSelectedImage(publicImage);
            onPosterOpened?.();
          }
        })
        .catch(error => {
          console.error('Error fetching specific poster:', error);
          // If poster not found, clear the target and remove from URL
          onPosterOpened?.();
          const url = new URL(window.location.href);
          url.searchParams.delete('poster');
          window.history.replaceState({}, '', url.toString());
        });
    }
  }, [targetPosterId, data, allImages, onPosterOpened]);



  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-red-500 mb-4">Failed to load images</p>
        <p className="text-gray-400 text-sm">{(error as Error).message}</p>
      </div>
    );
  }

  // Early return for loading state
  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array(limit).fill(null).map((_, index) => (
          <div key={index} className="poster-tile animate-pulse">
            <div className="relative w-full" style={{ aspectRatio: '1/1.414' }}>
              <div className="absolute inset-0 bg-gray-800 rounded-md overflow-hidden shadow-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Check if there are any images across all pages
  
  if (safePages.length === 0 || allImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-gray-300 mb-2">
          No public posters available yet
        </p>
        <p className="text-gray-400 text-sm">
          Be the first to share your creation!
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Image modal */}
      {selectedImage && (
        <CatalogueImageModal
          isOpen={!!selectedImage}
          onClose={closeImageModal}
          imageUrl={selectedImage.imageUrl}
          fullImageUrl={selectedImage.fullImageUrl}
          style={selectedImage.style}
          id={selectedImage.id}
          username={selectedImage.username}
          name={selectedImage.name}

          totalSupply={selectedImage.totalSupply}
          soldCount={selectedImage.soldCount}
          pricePerUnit={selectedImage.pricePerUnit}
          remainingSupply={selectedImage.remainingSupply}
          isAvailable={selectedImage.isAvailable}
          momentLink={selectedImage.momentLink}
          onOpenCart={onOpenCart}
          onShare={onShare}
          isAdminView={isAdminView}
        />
      )}
      
      <div className="flex flex-col space-y-8">
        {/* Image grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {allImages?.length > 0 && allImages.filter(image => image && image.id && image.imageUrl).map((image: PublicImage) => (
            <div 
              key={image.id} 
              className="poster-tile cursor-pointer"
              onClick={() => openImageModal(image)}
            >
              <div className="w-full bg-black" style={{ aspectRatio: '1/1.414' }}>
                <div className="w-full h-full relative group hover:outline hover:outline-[12px] hover:outline-white transition-all duration-300">
                  <img 
                    src={image.imageUrl} 
                    alt={`Poster with ${image.style || 'unknown'} style`}
                    className={`w-full h-full object-fill transition-all duration-300 ${!isAdminView ? 'select-none pointer-events-none' : ''}`}
                    loading="lazy"
                    style={!isAdminView ? { userSelect: 'none' } : {}}
                    draggable={isAdminView ? true : false}
                    onContextMenu={(e) => !isAdminView && e.preventDefault()}
                  />
                  
                  {/* Limited edition overlay - bottom left (all posters are limited edition) */}
                  {image.totalSupply && image.soldCount !== undefined && (
                    <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      #{(localEditions[image.id] ?? image.soldCount) + 1}/{image.totalSupply}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Admin edition controls - shown below each poster */}
              {isAdminView && image.totalSupply && image.soldCount !== undefined && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditionUpdate(image.id, localEditions[image.id] ?? image.soldCount, -1);
                    }}
                    disabled={(localEditions[image.id] ?? image.soldCount) <= 0}
                    className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white rounded p-1 transition-colors"
                    aria-label="Decrease edition"
                  >
                    <Minus size={16} />
                  </button>
                  
                  <span className="text-white text-sm font-medium min-w-[60px] text-center">
                    #{(localEditions[image.id] ?? image.soldCount) + 1}/{image.totalSupply}
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditionUpdate(image.id, localEditions[image.id] ?? image.soldCount, 1);
                    }}
                    disabled={(localEditions[image.id] ?? image.soldCount) >= image.totalSupply}
                    className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:opacity-50 text-white rounded p-1 transition-colors"
                    aria-label="Increase edition"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Loading indicator at bottom for infinite scroll */}
        <div ref={observerTarget} className="h-10 w-full flex justify-center">
          {isFetchingNextPage && (
            <div className="animate-pulse text-gray-400">Loading more posters...</div>
          )}
        </div>
      </div>
    </>
  );
}

export default memo(CatalogueGrid);