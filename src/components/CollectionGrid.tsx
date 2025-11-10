import { useState, useEffect } from "react";
import CatalogueImageModal from "@/components/CatalogueImageModal";
import { CollectionImage } from "@/hooks/useCollectionImages";

interface CollectionGridProps {
    images: CollectionImage[];
    isLoading: boolean;
    onShare?: (imageUrl: string, posterId?: string) => void;
    targetPosterId?: string | null;
    onPosterOpened?: () => void;
}

// Cafe partners configuration - using actual partners from Partners page
const cafePartners = [
    { logo: '/partners/kiosko-bello.jpg', name: 'Kiosko Bello', url: 'https://www.instagram.com/kiosko_bello/' },
    { logo: '/partners/caffeyolo.jpg', name: 'Caffèyolo', url: 'https://www.caffeyolo.ch/' },
    { logo: '/partners/coffee-twins.jpg', name: 'Coffee Twins', url: 'https://www.instagram.com/_coffee_twins_' },
    { logo: '/partners/papier-beurre.jpg', name: 'Papier Beurre', url: 'https://www.instagram.com/papierbeurre/' },
    { logo: '/partners/united-tastes.jpg', name: 'United Tastes', url: 'https://united-tastes.poush-dev.be/' },
    { logo: '/partners/alfred-caffebar.jpg', name: 'Alfred Caffeebar', url: 'https://www.instagram.com/alfred_caffebar/' },
    { logo: '/partners/ondo.jpg', name: 'Ondo', url: 'https://www.instagram.com/ondosocial' }
];

export default function CollectionGrid({ images, isLoading, onShare, targetPosterId, onPosterOpened }: CollectionGridProps) {
    const [selectedImage, setSelectedImage] = useState<CollectionImage | null>(null);

    // Handle opening poster from URL parameter
    useEffect(() => {
        if (targetPosterId && images.length > 0) {
            const targetImage = images.find(img => img.id === targetPosterId);
            if (targetImage) {
                setSelectedImage(targetImage);
                if (onPosterOpened) onPosterOpened();
            }
        }
    }, [targetPosterId, images, onPosterOpened]);

    // Open image in modal
    const openImageModal = (image: CollectionImage) => {
        setSelectedImage(image);
        const url = new URL(window.location.href);
        url.searchParams.set('poster', image.id);
        window.history.pushState({}, '', url.toString());
    };

    // Close modal
    const closeImageModal = () => {
        setSelectedImage(null);
        const url = new URL(window.location.href);
        url.searchParams.delete('poster');
        window.history.pushState({}, '', url.toString());
    };

    // Create array of 6 items (fill with placeholders if needed)
    const gridItems = [...images];
    while (gridItems.length < 6) {
        gridItems.push(null as any);
    }

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {[...Array(6)].map((_, index) => (
                    <div key={index} className="relative aspect-[1/1.414] bg-gray-900 rounded-sm animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {gridItems.slice(0, 6).map((image, index) => (
                    <div
                        key={image?.id || `empty-${index}`}
                        className="relative aspect-[1/1.414] bg-gray-900 rounded-sm overflow-hidden cursor-pointer group"
                        onClick={() => image && openImageModal(image)}
                    >
                        {image ? (
                            <>
                                {/* White border container */}
                                <div className="absolute inset-0 bg-white p-4 md:p-6">
                                    <div className="relative w-full h-full bg-black overflow-hidden">
                                        <img
                                            src={image.imageUrl}
                                            alt={`${image.style} poster`}
                                            className="w-full h-full object-cover object-center"
                                            loading="lazy"
                                        />
                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-end">
                                            <div className="p-4 w-full transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                                                <div className="text-white">
                                                    <p className="font-racing-sans text-lg">@{image.username || 'anonymous'}</p>
                                                    {image.name && (
                                                        <p className="text-sm text-gray-300 mt-1">{image.name}</p>
                                                    )}
                                                    {image.totalSupply !== undefined && (
                                                        <div>
                                                            <p className="text-xs text-gray-400 mt-2">
                                                                #{(image.soldCount || 0) + 1}/{image.totalSupply}
                                                            </p>
                                                            {/* Add likes count */}
                                                            {image.likesCount !== undefined && (
                                                                <p className="text-xs text-gray-400">
                                                                    {image.likesCount} {image.likesCount === 1 ? 'like' : 'likes'}
                                                                </p>
                                                            )}
                                                            {/* Cafe partner logo */}
                                                            <a
                                                                href={cafePartners[index % cafePartners.length].url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-block mt-2"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <img
                                                                    src={cafePartners[index % cafePartners.length].logo}
                                                                    alt={cafePartners[index % cafePartners.length].name}
                                                                    className="w-8 h-8 rounded-md object-cover"
                                                                />
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Empty placeholder
                            <div className="flex items-center justify-center w-full h-full text-gray-600">
                                <div className="text-center">
                                    <p className="text-sm">Coming Soon</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <CatalogueImageModal
                    isOpen={!!selectedImage}
                    onClose={closeImageModal}
                    imageUrl={selectedImage.imageUrl}
                    style={selectedImage.style}
                    id={selectedImage.id}
                    username={selectedImage.username || ""}
                    totalSupply={selectedImage.totalSupply}
                    soldCount={selectedImage.soldCount}
                    pricePerUnit={selectedImage.pricePerUnit}
                    remainingSupply={selectedImage.remainingSupply}
                    isAvailable={selectedImage.isAvailable}
                    onShare={onShare}
                    hideCart={true}
                    cafePartner={cafePartners[images.indexOf(selectedImage) % cafePartners.length]}
                />
            )}
        </>
    );
}