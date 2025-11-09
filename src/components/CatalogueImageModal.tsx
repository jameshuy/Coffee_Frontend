import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { XCircle, ShoppingCart, Check, ChevronLeft, ChevronRight, Loader2, Share, ExternalLink } from "lucide-react";
import { SiInstagram, SiTiktok, SiYoutube, SiX, SiFacebook, SiLinkedin } from "react-icons/si";
import { Button } from "@/components/ui/Button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useCart } from "@/context/CartContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface CatalogueImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  fullImageUrl?: string; // Optional full resolution URL for modal display
  style: string;
  id: string;
  username?: string;
  name?: string; // Poster name

  totalSupply?: number;
  soldCount?: number;
  pricePerUnit?: number;
  remainingSupply?: number;
  isAvailable?: boolean;
  momentLink?: string;
  onNext?: () => void;
  onPrevious?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onOpenCart?: () => void; // Callback to open the cart modal
  onShare?: (imageUrl: string, posterId?: string) => void; // Callback to open the share modal
  isAdminView?: boolean; // Flag to disable download prevention for admin view
}

export default function CatalogueImageModal({
  isOpen,
  onClose,
  imageUrl,
  fullImageUrl,
  style,
  id,
  username,
  name,

  totalSupply,
  soldCount,
  pricePerUnit,
  remainingSupply,
  isAvailable,
  momentLink,
  onNext,
  onPrevious,
  hasPrevious = true,
  hasNext = true,
  onOpenCart,
  onShare,
  isAdminView = false,
}: CatalogueImageModalProps) {
  const { addToCart, isInCart } = useCart();
  const [added, setAdded] = useState(false);
  const [showGoToCart, setShowGoToCart] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const price = pricePerUnit || 29.95; // All posters are limited edition with custom pricing

  // Function to get the appropriate social media icon
  const getSocialIcon = (url: string) => {
    const lowerUrl = url.toLowerCase();
    
    if (lowerUrl.includes('instagram.com')) {
      return <SiInstagram size={20} />;
    } else if (lowerUrl.includes('tiktok.com')) {
      return <SiTiktok size={20} />;
    } else if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      return <SiYoutube size={20} />;
    } else if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
      return <SiX size={20} />;
    } else if (lowerUrl.includes('facebook.com')) {
      return <SiFacebook size={20} />;
    } else if (lowerUrl.includes('linkedin.com')) {
      return <SiLinkedin size={20} />;
    } else {
      // Fallback to generic external link icon
      return <ExternalLink size={20} />;
    }
  };

  // Check if this item is already in the cart whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      const inCart = isInCart(id);
      setAdded(inCart);
      setShowGoToCart(inCart);
    }
  }, [isOpen, isInCart, id]);

  // Reset loading state when image changes
  useEffect(() => {
    setImageLoading(true);
  }, [fullImageUrl, imageUrl, id]);

  const handleAddToCart = () => {
    addToCart({
      id,
      imageUrl: imageUrl, // Thumbnail URL for cart display
      fullImageUrl: fullImageUrl || imageUrl, // Full-quality URL for orders/printing
      style,
      price,
      quantity: 1,
      isLimitedEdition: true // All posters are limited edition
    });
    
    setAdded(true);
    
    // Show toast notification
    toast({
      title: "Item added to cart",
      duration: 2000,
    });
    
    // Show "Added" for 1.5 seconds, then change to "Go to Cart"
    setTimeout(() => {
      setShowGoToCart(true);
    }, 1500);
  };

  const handleGoToCart = () => {
    onClose();
    if (onOpenCart) {
      onOpenCart();
    }
  };



  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="top-[50%] translate-y-[-50%] w-[calc(100%-1rem)] sm:max-w-4xl max-h-[90vh] p-0 bg-black border-gray-800 hide-default-close">
        <VisuallyHidden>
          <DialogTitle>Poster Details</DialogTitle>
        </VisuallyHidden>
        <div className="relative w-full h-full flex flex-col items-center p-4">
          
          {/* Poster container with white border */}
          <div className="flex items-center justify-center w-full min-h-[300px]">
            {/* Loading spinner - shown without white background */}
            {imageLoading && (
              <div className="flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            )}
            
            {/* Image container with white border and gallery-style labels */}
            {!imageLoading && (
              <div className="flex flex-col items-center">
                {/* Poster name above thumbnail */}
                {name && (
                  <h2 className="text-white text-lg font-semibold mb-3 text-center">
                    {name}
                  </h2>
                )}
                
                <div 
                  className="bg-white p-4 md:p-6 shadow-xl rounded-sm relative"
                  style={{ 
                    width: "auto",
                    height: "auto",
                    maxWidth: "90%",
                    maxHeight: "70vh"
                  }}
                >
                  <img
                    src={import.meta.env.VITE_API_URL + imageUrl}
                    alt={`Poster with ${style} style`}
                    className={!isAdminView ? "select-none pointer-events-none" : ""}
                    draggable={isAdminView ? true : false}
                    onContextMenu={(e) => !isAdminView && e.preventDefault()}
                    style={{
                      display: "block",
                      maxWidth: "100%",
                      maxHeight: "calc(70vh - 80px)",
                      width: "auto",
                      height: "auto",
                      objectFit: "contain",
                      userSelect: !isAdminView ? "none" : "auto"
                    }}
                  />
                </div>
                
                {/* Gallery-style placard underneath the frame */}
                <div className="w-full max-w-[90%] mt-2 px-2">
                  {/* Single line with username, supply, and price */}
                  <div className="flex justify-between items-center">
                    {/* Creator name - left */}
                    {username && (
                      <p className="text-white font-medium text-sm">
                        @{username}
                      </p>
                    )}
                    
                    {/* Supply info - center (all posters are limited edition now) */}
                    {soldCount !== undefined && totalSupply && (
                      <p className={`text-sm font-medium ${soldCount >= totalSupply - 5 ? 'text-red-400' : 'text-gray-300'}`}>
                        #{soldCount + 1}/{totalSupply}
                      </p>
                    )}
                    
                    {/* Price - right */}
                    <p className="text-gray-300 text-sm font-medium">
                      CHF {price.toFixed(2)}.-
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Hidden image for loading detection */}
            <img
              src={import.meta.env.VITE_API_URL + imageUrl}
              alt=""
              className="hidden"
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
          </div>
          
          {/* Add to Cart and Close button section */}
          <div className="flex items-center justify-center space-x-4 mt-6 w-full max-w-md">
            
            {/* Social Link button - only show if momentLink exists */}
            {momentLink && (
              <button
                onClick={() => window.open(momentLink, '_blank', 'noopener,noreferrer')}
                className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 flex items-center justify-center transition-colors"
                aria-label="View original moment"
              >
                {getSocialIcon(momentLink)}
              </button>
            )}
            
            {/* Add to Cart button */}
            <button
              onClick={showGoToCart ? handleGoToCart : handleAddToCart}
              className={`${
                showGoToCart 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : added 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-700 hover:bg-gray-600'
              } text-white rounded-full p-2 flex items-center justify-center transition-colors`}
              aria-label={showGoToCart ? "Go to Cart" : added ? "Added to Cart" : "Add to Cart"}
              disabled={added && !showGoToCart}
            >
              {showGoToCart ? (
                <ShoppingCart size={20} />
              ) : added ? (
                <Check size={20} />
              ) : (
                <ShoppingCart size={20} />
              )}
            </button>
            
            {/* Custom close button */}
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <XCircle size={20} />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}