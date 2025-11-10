import { useState, useEffect, useRef, useCallback } from "react";
import CatalogueImageModal from "@/components/CatalogueImageModal";
import { CollectionImage } from "@/hooks/useCollectionImages";
import { useAuth } from "@/context/AuthContext";
import { LoginModal } from "@/components/LoginModal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CollectionCarouselProps {
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

export default function CollectionCarousel({ images, isLoading, onShare, targetPosterId, onPosterOpened }: CollectionCarouselProps) {
    const [selectedImage, setSelectedImage] = useState<CollectionImage | null>(null);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemHeight, setItemHeight] = useState(600);
    const [showOverlay, setShowOverlay] = useState<{ [key: string]: boolean }>({});
    const [hasLiked, setHasLiked] = useState<{ [key: string]: boolean }>({});
    const [likeCount, setLikeCount] = useState<{ [key: string]: number }>({});
    const hideOverlayTimeouts = useRef<{ [key: string]: NodeJS.Timeout }>({});
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const { toast } = useToast();
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const [calculatedContainerHeight, setCalculatedContainerHeight] = useState<number | null>(null);
    const [calculatedImageSize, setCalculatedImageSize] = useState<{ width: number; height: number } | null>(null);

    // Calculate item height based on viewport
    useEffect(() => {
        const calculateItemHeight = () => {
            const vh = window.innerHeight;
            // Get dynamic nav heights from CSS variables or use defaults
            const navHeightStr = getComputedStyle(document.documentElement).getPropertyValue('--nav-height').trim();
            const bottomNavHeightStr = getComputedStyle(document.documentElement).getPropertyValue('--bottom-nav-height').trim();

            const navHeight = navHeightStr ? parseInt(navHeightStr) : 80;
            const bottomNavHeight = bottomNavHeightStr ? parseInt(bottomNavHeightStr) : 80;

            // Calculate available height
            const availableHeight = vh - navHeight - bottomNavHeight;
            setItemHeight(Math.max(400, availableHeight)); // Ensure minimum height
        };

        // Initial calculation with a slight delay to ensure CSS variables are set
        const initialTimer = setTimeout(calculateItemHeight, 100);

        // Recalculate on resize and when CSS variables change
        window.addEventListener('resize', calculateItemHeight);

        // Use MutationObserver to watch for CSS variable changes
        const observer = new MutationObserver(calculateItemHeight);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['style']
        });

        return () => {
            clearTimeout(initialTimer);
            window.removeEventListener('resize', calculateItemHeight);
            observer.disconnect();
        };
    }, []);

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

    // Handle scroll to track current index
    useEffect(() => {
        const handleScroll = () => {
            if (scrollContainerRef.current) {
                const scrollTop = scrollContainerRef.current.scrollTop;
                const index = Math.round(scrollTop / itemHeight);
                setCurrentIndex(Math.min(index, images.length - 1));
            }
        };

        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [itemHeight, images.length]);

    // Calculate container height and image size (match FeedItem behavior)
    const calculateContainerHeight = useCallback(() => {
        const imageContainer = imageContainerRef.current;
        if (!imageContainer) return;

        const containerRect = imageContainer.getBoundingClientRect();
        let availableWidth = containerRect.width;

        // Fallback: try parent width if current is 0
        if (availableWidth === 0 && imageContainer.parentElement) {
            availableWidth = imageContainer.parentElement.getBoundingClientRect().width;
        }
        if (availableWidth === 0) return;

        // Get natural image dimensions
        const img = imageRef.current;
        const naturalWidth = img?.naturalWidth || 0;
        const naturalHeight = img?.naturalHeight || 0;
        if (naturalWidth === 0 || naturalHeight === 0) return;

        // Calculate aspect ratio
        const mediaAspect = naturalWidth / naturalHeight;

        // With 18px padding on each side (36px total), calculate image width
        const imageWidth = availableWidth - 36;
        if (imageWidth <= 0) return;

        const imageHeight = imageWidth / mediaAspect;
        setCalculatedImageSize({ width: imageWidth, height: imageHeight });

        // Container height = image height + 36px (18 top + 18 bottom)
        const calculatedHeight = imageHeight + 36;
        // Don't exceed available item height
        const finalHeight = Math.min(calculatedHeight, itemHeight);
        setCalculatedContainerHeight(finalHeight);
    }, [itemHeight]);

    // Recalculate on resize and when image loads
    useEffect(() => {
        const update = () => {
            // Slight delay to ensure layout settles
            setTimeout(calculateContainerHeight, 50);
        };

        // Listen for image load
        const img = imageRef.current;
        if (img) {
            img.addEventListener('load', update);
        }

        // Resize observer on container
        const resizeObserver = new ResizeObserver(update);
        if (imageContainerRef.current) {
            resizeObserver.observe(imageContainerRef.current);
        }
        if (imageContainerRef.current?.parentElement) {
            resizeObserver.observe(imageContainerRef.current.parentElement);
        }

        // Initial calc
        update();

        return () => {
            if (img) {
                img.removeEventListener('load', update);
            }
            resizeObserver.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [calculateContainerHeight, itemHeight, images.length]);

    const handleLike = async (imageId: string) => {
        if (!user) {
            setShowLoginModal(true);
            return;
        }

        try {
            const response = await apiRequest('POST', `/api/posters/${imageId}/like`);

            if (response.ok) {
                const data = await response.json();
                setLikeCount(prev => ({ ...prev, [imageId]: data.likeCount }));
                setHasLiked(prev => ({ ...prev, [imageId]: data.hasLiked }));
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
    };

    const handleShowOverlay = (imageId: string) => {
        // Show overlay
        setShowOverlay(prev => ({ ...prev, [imageId]: true }));

        // Clear existing timeout
        if (hideOverlayTimeouts.current[imageId]) {
            clearTimeout(hideOverlayTimeouts.current[imageId]);
        }

        // Hide after 3 seconds
        hideOverlayTimeouts.current[imageId] = setTimeout(() => {
            setShowOverlay(prev => ({ ...prev, [imageId]: false }));
        }, 3000);
    };

    const openImageModal = (image: CollectionImage) => {
        setSelectedImage(image);
        const url = new URL(window.location.href);
        url.searchParams.set('poster', image.id);
        window.history.pushState({}, '', url.toString());
    };

    const closeImageModal = () => {
        setSelectedImage(null);
        const url = new URL(window.location.href);
        url.searchParams.delete('poster');
        window.history.pushState({}, '', url.toString());
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    return (
        <>
            <div
                ref={scrollContainerRef}
                className="h-full overflow-y-auto snap-y snap-mandatory no-scrollbar mt-1"
                style={{ scrollBehavior: 'smooth' }}
            >
                {images.map((image, index) => (
                    <div
                        key={image.id}
                        className="snap-start flex items-center justify-center h-screen"
                    >
                        <div
                            ref={imageContainerRef}
                            className="w-full max-w-full bg-white p-[18px] flex items-center justify-center relative cursor-pointer"
                            style={{
                                height: calculatedContainerHeight ? `${calculatedContainerHeight}px` : 'auto',
                                maxHeight: '100%'
                            }}
                            onClick={() => {
                                handleShowOverlay(image.id);
                            }}
                        >
                            <div ref={containerRef} className="relative w-full h-full overflow-hidden flex items-center justify-center">
                                {/* Poster image */}
                                <img
                                    ref={imageRef}
                                    src={image.imageUrl}
                                    alt={`${image.style} poster`}
                                    className=""
                                    style={{
                                        width: calculatedImageSize ? `${calculatedImageSize.width}px` : '100%',
                                        height: calculatedImageSize ? `${calculatedImageSize.height}px` : 'auto',
                                        objectFit: 'contain'
                                    }}
                                    loading="lazy"
                                />

                                {/* Overlay with info */}
                                <div
                                    className={`absolute inset-0 transition-all duration-300 flex items-end ${showOverlay[image.id] ? 'bg-black bg-opacity-40' : 'bg-black bg-opacity-0 pointer-events-none'
                                        }`}
                                >
                                    <div className={`p-4 w-full transition-opacity duration-300 ${showOverlay[image.id] ? 'opacity-100' : 'opacity-0'
                                        }`}>
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

                                {/* Action buttons completely removed from café collection page */}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Login Modal */}
            <LoginModal
                open={showLoginModal}
                onOpenChange={setShowLoginModal}
            />

            {/* Catalogue Modal */}
            {selectedImage && (
                <CatalogueImageModal
                    isOpen={!!selectedImage}
                    onClose={closeImageModal}
                    imageUrl={`/api/storage-image/${selectedImage.generatedPath}`}
                    style={selectedImage.style}
                    id={selectedImage.id}
                    username={selectedImage.username}
                    name={selectedImage.name}
                    totalSupply={selectedImage.totalSupply}
                    soldCount={selectedImage.soldCount}
                    pricePerUnit={selectedImage.pricePerUnit}
                    remainingSupply={selectedImage.remainingSupply}
                    isAvailable={selectedImage.isAvailable}
                    onShare={(imageUrl: string) => {
                        if (onShare) {
                            onShare(imageUrl, selectedImage.id);
                        }
                    }}
                />
            )}
        </>
    );
}