import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CatalogueGrid from "@/components/CatalogueGrid";
import ShareModal from "@/components/ShareModal";
import { useState, useEffect } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function AdminCatalogue() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState("");
  const [sharePosterId, setSharePosterId] = useState("");
  const [_, setLocation] = useLocation();

  const [targetPosterId, setTargetPosterId] = useState<string | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  
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
        {/* Header with back button, title, and search - matching AdminReview layout */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setLocation('/admin/orders')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} className="sm:w-6 sm:h-6" />
          </button>
          
          {/* Centered Title */}
          <div className="flex-1 flex justify-center">
            <h1 className="text-2xl font-bold text-[#f1b917] text-center">
              <span className="hidden sm:inline">Admin Catalogue (Full Resolution)</span>
              <span className="sm:hidden">Admin Catalogue</span>
            </h1>
          </div>
          
          {/* Search Icon */}
          <div className="search-container flex items-center">
            <button 
              className="text-gray-400 hover:text-white transition-colors flex items-center justify-center"
              onClick={() => {
                if (isSearchExpanded) {
                  setSearchQuery(""); // Clear search when hiding
                }
                setIsSearchExpanded(!isSearchExpanded);
              }}
              aria-label="Toggle search"
            >
              <Search size={20} className="sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
        
        {/* Horizontal line */}
        <div className="w-full h-px bg-white mb-6"></div>
        
        {/* Animated Search Bar - appears below the header */}
        <div className={`w-full transition-all duration-300 ease-in-out overflow-hidden ${
          isSearchExpanded ? 'max-h-20 opacity-100 mb-6' : 'max-h-0 opacity-0'
        }`}>
          <div className="flex justify-center px-4">
            <div className="search-input-area relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search creators or poster names"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 placeholder:text-xs focus:outline-none focus:border-[#f1b917]"
                autoFocus={isSearchExpanded}
              />
            </div>
          </div>
        </div>
        
        {/* Responsive grid with real data - using admin endpoint */}
        <CatalogueGrid 
          searchQuery={searchQuery} 
          targetPosterId={targetPosterId}
          onOpenCart={() => {}} // No cart functionality in admin view
          onShare={(imageUrl: string, posterId?: string) => {
            setShareImageUrl(imageUrl);
            setSharePosterId(posterId || "");
            setShowShareModal(true);
          }}
          onPosterOpened={() => setTargetPosterId(null)}
          isAdminView={true} // Pass flag to use admin endpoint
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
      
      <Footer showTopLine={true} />
    </div>
  );
}