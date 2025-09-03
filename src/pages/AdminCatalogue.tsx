import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import CatalogueGrid from "@/components/CatalogueGrid";
import ShareModal from "@/components/ShareModal";
import { useState, useEffect } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/Button";

export default function AdminCatalogue() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState("");
  const [sharePosterId, setSharePosterId] = useState("");

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
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-full flex items-center justify-between mt-4">
            {/* Back to Admin Orders button */}
            <Link href="/admin/orders">
              <Button variant="outline" size="sm" className="text-white border-[#f1b917] hover:bg-[#f1b917] hover:text-black">
                <ArrowLeft className="mr-2" size={16} />
                Back to Admin
              </Button>
            </Link>
            
            {/* Title in center */}
            <h1 className="text-2xl font-bold text-[#f1b917] absolute left-1/2 transform -translate-x-1/2">
              Admin Catalogue (Full Resolution)
            </h1>
            
            {/* Search Icon */}
            <div className="flex items-center gap-2">
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
            </div>
          </div>
          
          {/* Horizontal line */}
          <div className="w-full h-px bg-white mt-3"></div>
          
          {/* Animated Search Bar - appears below the icons */}
          <div className={`w-full transition-all duration-300 ease-in-out overflow-hidden ${
            isSearchExpanded ? 'max-h-20 opacity-100 mt-4' : 'max-h-0 opacity-0'
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