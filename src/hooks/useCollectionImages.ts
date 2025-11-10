import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export interface CollectionImage {
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
    likesCount?: number; // Add likes count
}

export function useCollectionImages() {
    return useQuery<CollectionImage[]>({
        queryKey: ['/api/collection-images'],
        queryFn: async () => {
            try {
                // Fetch top 6 from the collection-images endpoint using scoring algorithm
                const response = await apiRequest('GET', '/api/collection-images');
                if (!response.ok) {
                    throw new Error('Failed to fetch collection images');
                }
                const result = await response.json();
                return result.images || [];
            } catch (error) {
                console.error('Error fetching collection images:', error);
                return [];
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
}