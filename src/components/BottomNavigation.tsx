import { Link, useLocation } from "wouter";
import { Home, Camera, Layers, Store, User, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import ImageSourceModal from "./ImageSourceModal";

export default function BottomNavigation() {
    const [location] = useLocation();
    const { isAuthenticated, logout } = useAuth();
    const [isImageSourceModalOpen, setIsImageSourceModalOpen] = useState(false);

    // Don't show on landing page
    if (location === "/" && !isAuthenticated) {
        return null;
    }

    const isFeedPage = location === "/winners" || location === "/feed";
    const isCreatePage = location === "/create";
    const isCataloguePage = location === "" || location === "/catalogue";
    const isCollectionPage = location === "/collection"
    const isDashboardPage = location === "/dashboard";
    const isSettingsPage = location === "/settings";

    const handleCameraClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Don't open modal if we're already on the create page
        if (isCreatePage) {
            return;
        }
        // Toggle modal - if open, close it; if closed, open it
        setIsImageSourceModalOpen(prev => !prev);
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 right-0 z-[80] bg-black" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="container mx-auto px-4">
                    <div className="w-full h-[1px] bg-white"></div>
                </div>
                <div className="flex justify-center items-center gap-6 py-3">
                    <>
                        <Link href="/feed">
                            <div className={`p-2 transition-colors cursor-pointer ${isFeedPage ? 'text-[#f1b917]' : 'text-white hover:text-[#f1b917]'
                                }`}>
                                <Home size={24} />
                            </div>
                        </Link>

                        <Link href="/create">
                            <div
                                onClick={handleCameraClick}
                                className={`p-2 transition-colors cursor-pointer ${isCreatePage ? 'text-[#f1b917] opacity-90' : 'text-white hover:text-[#f1b917]'
                                    }`}>
                                <Camera size={24} />
                            </div>
                        </Link>

                        <Link href="/collection">
                            <div className={`p-2 transition-colors cursor-pointer ${isCollectionPage ? 'text-[#f1b917]' : 'text-white hover:text-[#f1b917]'
                                }`}>
                                <Layers size={24} />
                            </div>
                        </Link>

                        <Link href="/catalogue">
                            <div className={`p-2 transition-colors cursor-pointer ${isCataloguePage ? 'text-[#f1b917]' : 'text-white hover:text-[#f1b917]'
                                }`}>
                                <Store size={24} />
                            </div>
                        </Link>

                        <Link href="/dashboard">
                            <div className={`p-2 transition-colors cursor-pointer ${isDashboardPage ? 'text-[#f1b917]' : 'text-white hover:text-[#f1b917]'
                                }`}>
                                <User size={24} />
                            </div>
                        </Link>
                    </>
                </div>
            </div>

            <ImageSourceModal
                isOpen={isImageSourceModalOpen}
                onClose={() => setIsImageSourceModalOpen(false)}
            />
        </>
    );
}