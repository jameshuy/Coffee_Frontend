import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CatalogueGrid from "@/components/CatalogueGrid";
import CartCheckoutModal from "@/components/CartCheckoutModal";
import ShareModal from "@/components/ShareModal";
import { useState, useEffect, useCallback } from "react";
import { ShoppingCart, User, Search, Play } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useIsMobile } from "@/hooks/use-mobile";
import BottomNavigation from "@/components/BottomNavigation";

export default function Catalogue() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState("");
  const [sharePosterId, setSharePosterId] = useState("");

  const [targetPosterId, setTargetPosterId] = useState<string | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { cartItems } = useCart();
  const { isAuthenticated } = useAuth();
  const debouncedSearch = useDebouncedValue(searchQuery, 300);
  const isMobile = useIsMobile();

  const handleOpenCart = useCallback(() => setIsCartOpen(true), []);
  const handleShare = useCallback((imageUrl: string, posterId?: string) => {
    setShareImageUrl(imageUrl);
    setSharePosterId(posterId || "");
    setShowShareModal(true);
  }, []);
  const handlePosterOpened = useCallback(() => setTargetPosterId(null), []);

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

  // Scroll to top when catalogue page is loaded
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Handle escape key and clicks outside search to close expanded search
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchQuery(""); // Clear search when closing with escape
        setIsSearchExpanded(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.search-container') && !target.closest('.search-input-area')) {
        setSearchQuery(""); // Clear search when clicking outside
        setIsSearchExpanded(false);
      }
    };

    if (isSearchExpanded) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isSearchExpanded]);



  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navigation />

      <main className="flex-grow container mx-auto px-4 pt-1 pb-6 relative">
        {!isMobile ? <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-full flex items-center justify-between mt-4">
            {/* Create Print button - shows for all users */}
            <Link href="/create">
              <button
                className="bg-white text-black px-4 py-1 rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-sm"
              >
                {isAuthenticated ? 'Create Prints' : 'Create your first Print'}
              </button>
            </Link>

            {/* Search, Profile and Cart Icons */}
            <div className="flex items-center gap-2">
              {/* Search Icon */}
              <div className="search-container">
                <button
                  className="p-2 text-white hover:text-[#f1b917] transition-colors"
                  onClick={() => {
                    if (isSearchExpanded) {
                      setSearchQuery(""); // Clear search when hiding
                    }
                    setIsSearchExpanded(!isSearchExpanded);
                  }}
                  aria-label="Toggle search"
                >
                  <Search size={24} />
                </button>
              </div>

              {/* Feed Icon */}
              <Link href="/feed" className="p-2 text-white hover:text-[#f1b917] transition-colors z-10" aria-label="Go to feed">
                <Play size={24} />
              </Link>

              <Link href="/dashboard" className="p-2 text-white hover:text-[#f1b917] transition-colors z-10" aria-label="Go to dashboard">
                <User size={24} />
              </Link>

              <div className="relative">
                <button
                  className="p-2 text-white hover:text-[#f1b917] transition-colors z-10"
                  onClick={handleOpenCart}
                  aria-label="Open cart"
                >
                  <ShoppingCart size={24} />
                </button>
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#f1b917] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Horizontal line spanning from filter box to cart icon */}
          <div className="w-full h-px bg-white mt-3"></div>

          {/* Animated Search Bar - appears below the icons */}
          <div className={`w-full transition-all duration-300 ease-in-out overflow-hidden ${isSearchExpanded ? 'max-h-20 opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}>
            <div className="flex justify-center">
              <div className="search-input-area relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search creators or poster names"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 placeholder:text-xs focus:outline-none focus:border-[#f1b917]"
                  autoFocus={isSearchExpanded}
                />
              </div>
            </div>
          </div>
        </div> : (
          <div className="flex flex-col items-center justify-center mb-6">
            <div className="w-full flex items-center justify-between mt-4">
              {/* Search Bar */}
              <div className="flex justify-center w-full">
                <div className="search-input-area relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search creators or poster names"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 placeholder:text-xs focus:outline-none focus:border-[#f1b917]"
                  />
                </div>
              </div>

              {/* Cart Button */}
              <div className="relative ml-4">
                <button
                  className="p-2 text-white hover:text-[#f1b917] transition-colors z-10"
                  onClick={() => setIsCartOpen(true)}
                  aria-label="Open cart"
                >
                  <ShoppingCart size={24} />
                </button>
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#f1b917] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItems.length}
                  </span>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Responsive grid with real data */}
        <CatalogueGrid
          searchQuery={debouncedSearch}
          targetPosterId={targetPosterId}
          onOpenCart={handleOpenCart}
          onShare={handleShare}
          onPosterOpened={handlePosterOpened}
        />

        {/* Cart Modal */}
        <CartCheckoutModal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
        />

        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          imageUrl={shareImageUrl}
          shareContext="catalogue"
          posterId={sharePosterId}
        />
      </main>

      {!isMobile ? <Footer showTopLine={true} /> : <BottomNavigation />}
    </div>
  );
}