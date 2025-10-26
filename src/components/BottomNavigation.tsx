import { Link, useLocation } from "wouter";
import { Home, Camera, Layers, User, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function BottomNavigation() {
    const [location] = useLocation();
    const { isAuthenticated, logout } = useAuth();

    // Don't show on landing page
    if (location === "/" && !isAuthenticated) {
        return null;
    }

    const isFeedPage = location === "/winners" || location === "/feed";
    const isCreatePage = location === "/create";
    const isCataloguePage = location === "" || location === "/catalogue";
    const isDashboardPage = location === "/dashboard";
    const isSettingsPage = location === "/settings";

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="container mx-auto px-4">
                <div className="w-full h-[1px] bg-white"></div>
            </div>
            <div className="flex justify-center items-center gap-6 py-3">
                {isAuthenticated && (
                    <>
                        <Link href="/feed">
                            <div className={`p-2 transition-colors cursor-pointer ${isFeedPage ? 'text-[#f1b917]' : 'text-white hover:text-[#f1b917]'
                                }`}>
                                <Home size={24} />
                            </div>
                        </Link>

                        <Link href="/create">
                            <div className={`p-2 transition-colors cursor-pointer ${isCreatePage ? 'text-[#f1b917]' : 'text-white hover:text-[#f1b917]'
                                }`}>
                                <Camera size={24} />
                            </div>
                        </Link>

                        <Link href="/catalogue">
                            <div className={`p-2 transition-colors cursor-pointer ${isCataloguePage ? 'text-[#f1b917]' : 'text-white hover:text-[#f1b917]'
                                }`}>
                                <Layers size={24} />
                            </div>
                        </Link>

                        <Link href="/dashboard">
                            <div className={`p-2 transition-colors cursor-pointer ${isDashboardPage ? 'text-[#f1b917]' : 'text-white hover:text-[#f1b917]'
                                }`}>
                                <User size={24} />
                            </div>
                        </Link>

                        <button
                            onClick={logout}
                            className="p-2 text-white hover:text-red-400 transition-colors cursor-pointer"
                        >
                            <LogOut size={24} />
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}