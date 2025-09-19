import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Check, X, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

interface PendingImage {
  id: string;
  generatedPath: string;
  style: string;
  createdAt: string;
  imageUrl: string;
  fullImageUrl?: string;
  username?: string;
  name?: string;
  totalSupply?: number;
  soldCount?: number;
  pricePerUnit?: number;
  city?: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

interface PendingImagesResponse {
  images: PendingImage[];
  pagination: PaginationInfo;
}

export default function AdminReview() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch
  } = useInfiniteQuery<PendingImagesResponse>({
    queryKey: ['/api/admin/pending-review'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiRequest("GET", `/api/admin/pending-review?limit=20&offset=${pageParam}`);

      if (!response.ok) {
        if (response.status === 401) {
          setLocation('/admin/login');
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch pending images');
      }
      return response.json();
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage?.pagination?.hasMore) return undefined;
      return lastPage.pagination.offset + lastPage.pagination.limit;
    },
    initialPageParam: 0,
  });

  const approveMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await apiRequest('PATCH', `/api/admin/images/${imageId}/approve`);
      return response.json();
    },
    onSuccess: (data, imageId) => {
      toast({
        title: "Poster Approved",
        description: "The poster has been added to the catalogue",
        duration: 2000,
      });
      // Refetch to update the list
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await apiRequest('PATCH', `/api/admin/images/${imageId}/reject`);
      return response.json();
    },
    onSuccess: (data, imageId) => {
      toast({
        title: "Poster Rejected",
        description: "The poster has been removed from the review queue",
        duration: 2000,
      });
      // Refetch to update the list
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  const allImages = data?.pages?.flatMap(page => page.images) || [];
  const totalPending = data?.pages?.[0]?.pagination?.total || 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />

      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/admin/orders')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Review Queue</h1>
              <p className="text-gray-400 mt-1">
                {totalPending} poster{totalPending !== 1 ? 's' : ''} pending approval
              </p>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array(8).fill(null).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="relative w-full" style={{ aspectRatio: '1/1.414' }}>
                  <div className="absolute inset-0 bg-gray-800 rounded-md overflow-hidden shadow-lg" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-red-500 mb-4">Failed to load pending images</p>
            <p className="text-gray-400 text-sm">{(error as Error).message}</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && allImages.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-gray-300 mb-2">
              No posters pending review
            </p>
            <p className="text-gray-400 text-sm">
              New submissions will appear here for approval
            </p>
          </div>
        )}

        {/* Image grid */}
        {!isLoading && !isError && allImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {allImages.map((image) => (
              <div
                key={image.id}
                className="poster-tile"
              >
                <div className="w-full bg-black" style={{ aspectRatio: '1/1.414' }}>
                  <div className="w-full h-full relative group hover:outline hover:outline-[12px] hover:outline-white transition-all duration-300">
                    <img
                      src={import.meta.env.VITE_API_URL + image.imageUrl}
                      alt={`Poster with ${image.style || 'unknown'} style`}
                      className="w-full h-full object-fill transition-all duration-300"
                      loading="lazy"
                    />

                    {/* Action buttons overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
                      <button
                        onClick={() => approveMutation.mutate(image.id)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-full p-3 transition-colors"
                        aria-label="Approve poster"
                      >
                        <Check size={24} />
                      </button>

                      <button
                        onClick={() => rejectMutation.mutate(image.id)}
                        disabled={rejectMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-full p-3 transition-colors"
                        aria-label="Reject poster"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    {/* Poster info overlay */}
                    {(image.name || image.username) && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                        {image.name && (
                          <p className="text-white text-sm font-semibold truncate">{image.name}</p>
                        )}
                        {image.username && (
                          <p className="text-gray-300 text-xs">by {image.username}</p>
                        )}
                        {image.city && (
                          <p className="text-gray-400 text-xs">{image.city}</p>
                        )}
                        {image.totalSupply && image.pricePerUnit && (
                          <p className="text-gray-300 text-xs mt-1">
                            {image.totalSupply} prints @ {image.pricePerUnit} CHF
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load more button */}
        {hasNextPage && (
          <div className="flex justify-center mt-8">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isFetchingNextPage ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}