import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import CollectionGrid from "@/components/CollectionGrid";
import CollectionCarousel from "@/components/CollectionCarousel";
import ShareModal from "@/components/ShareModal";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCollectionImages } from "@/hooks/useCollectionImages";
import { useIsMobile } from "@/hooks/use-mobile";
import Footer from "@/components/Footer";

export default function Collection() {
    const [showShareModal, setShowShareModal] = useState(false);
    const [shareImageUrl, setShareImageUrl] = useState("");
    const [sharePosterId, setSharePosterId] = useState("");
    const [targetPosterId, setTargetPosterId] = useState<string | null>(null);
    const [location, setLocation] = useLocation();
    const { data: images = [], isLoading } = useCollectionImages();

    const isMobile = useIsMobile();

    // Handle URL parameters for direct poster links
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const posterId = urlParams.get('poster');
        const showPosterId = urlParams.get('showPoster');

        if (posterId) {
            setTargetPosterId(posterId);
        } else if (showPosterId) {
            setTargetPosterId(showPosterId);
        }
    }, []);

    // Scroll to top when collection page is loaded
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="h-screen bg-black flex flex-col overflow-hidden">
            <Navigation />

            <main
                className="flex-1 flex flex-col overflow-hidden"
            >
                {/* Mobile Carousel - visible on small screens */}
                <div className="flex-1 sm:hidden overflow-hidden justify-center items-center">
                    <CollectionCarousel
                        images={images}
                        isLoading={isLoading}
                        targetPosterId={targetPosterId}
                        onShare={(imageUrl: string, posterId?: string) => {
                            setShareImageUrl(imageUrl);
                            setSharePosterId(posterId || "");
                            setShowShareModal(true);
                        }}
                        onPosterOpened={() => setTargetPosterId(null)}
                    />
                </div>

                {/* Desktop Grid - hidden on small screens, visible on larger */}
                <div className="hidden sm:flex flex-1 items-center justify-center px-8 overflow-y-auto pb-4 pt-64">
                    <div className="w-full max-w-7xl pt-[300px]">
                        <CollectionGrid
                            images={images}
                            isLoading={isLoading}
                            targetPosterId={targetPosterId}
                            onShare={(imageUrl: string, posterId?: string) => {
                                setShareImageUrl(imageUrl);
                                setSharePosterId(posterId || "");
                                setShowShareModal(true);
                            }}
                            onPosterOpened={() => setTargetPosterId(null)}
                        />
                    </div>
                </div>

                {/* Share Modal */}
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    imageUrl={shareImageUrl}
                    shareContext="collection"
                    posterId={sharePosterId}
                />
            </main>

            {!isMobile ? <Footer showTopLine={true} /> : <BottomNavigation />}
        </div>
    );
}