import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";

import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tag, AlertTriangle, XCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import SubscriptionModal from "@/components/SubscriptionModal";

// Terms and Conditions Dialog component
function TermsDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 bg-black border-gray-800">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl text-center text-white">Terms and Conditions</DialogTitle>
        </DialogHeader>

        <div className="p-6 h-[60vh] overflow-y-auto">
          <div className="space-y-6 text-gray-300">
            <h2 className="text-lg font-semibold text-[#f1b917]">Creator Terms of Poster Submission</h2>
            <p>By submitting a poster for sale on Coffee&Prints, you ("the Creator") agree to the following terms:</p>
            
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">1. Ownership & Rights Transfer</h3>
              <p>You affirm that the image you uploaded is your own, or that you have the legal right to use and transform it.</p>
              <p>You acknowledge that the poster created through the Coffee&Prints platform incorporates proprietary styles, formatting, layout, and other creative elements owned by PolyCraft SNC.</p>
              <p>By submitting your poster for sale, you assign all commercial rights in the final poster artwork to PolyCraft SNC, the parent company of Coffee&Prints. This includes the rights to reproduce, distribute, sell, license, modify, and use the poster in any format and medium, globally and indefinitely.</p>
              <p>This transfer is irrevocable and applies to all commercial and derivative uses of the submitted poster.</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">2. Revenue Sharing</h3>
              <p>For each sale of your submitted poster via the Coffee&Prints platform, you will receive a creator commission of 16% of every standard edition sale and up to 70% on every limited edition sale.</p>
              <p>Payments are issued monthly and require accurate payout information to be provided in your account.</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">3. Attribution & Representation</h3>
              <p>You may be credited as the original creator of the uploaded photo or concept.</p>
              <p>PolyCraft SNC retains sole discretion over how, where, and whether the poster is marketed, sold, licensed, or featured, including through third-party channels.</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">4. Eligibility & Quality Control</h3>
              <p>We reserve the right to reject or remove any poster that does not meet our technical, legal, or aesthetic standards.</p>
              <p>This includes posters suspected of copyright infringement, inappropriate content, or failure to meet print quality standards.</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">5. Legal Warranty & Indemnity</h3>
              <p>You certify that your uploaded image does not infringe on any third-party rights, including copyright, trademark, or privacy rights.</p>
              <p>You agree to indemnify PolyCraft SNC against any legal claims or liabilities arising from your submitted content.</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">6. Updates</h3>
              <p>PolyCraft SNC may update these terms at any time. You will be notified of material changes. Continued use of the Coffee&Prints platform constitutes acceptance of any updated terms.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 pt-2">
          <Button 
            className="w-full px-6 py-3 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-base"
            onClick={onClose}
          >
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface SellPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userEmail: string | null;
  posterPath: string | null;
}

export default function SellPosterModal({
  isOpen,
  onClose,
  onSuccess,
  userEmail,
  posterPath,
}: SellPosterModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [userStats, setUserStats] = useState<{ postersForSale: number; isSubscribed: boolean } | null>(null);
  
  // Poster details state
  const [posterName, setPosterName] = useState<string>('');
  const [momentLink, setMomentLink] = useState<string>('');
  const [city, setCity] = useState<string>('');
  
  // Limited edition state (all posters are now limited edition)
  const [totalSupply, setTotalSupply] = useState<string>('50');
  const [pricePerUnit, setPricePerUnit] = useState<string>('45.00');

  // Check user's poster selling eligibility when modal opens
  useEffect(() => {
    const checkUserEligibility = async () => {
      if (!isOpen || !userEmail) {
        console.log('SellPosterModal - Modal not open or no user email:', { isOpen, userEmail });
        return;
      }
      
      console.log('SellPosterModal - Checking eligibility for:', userEmail);
      console.log('SellPosterModal - Auth user object:', user);
      
      try {
        const response = await apiRequest('GET', `/api/user-poster-stats?email=${encodeURIComponent(userEmail)}`);
        if (response.ok) {
          const stats = await response.json();
          console.log('SellPosterModal - User stats loaded:', stats);
          setUserStats(stats);
          
          // If user has already used both their free poster sales and is not subscribed, show subscription modal immediately
          if (!stats.isSubscribed && stats.postersForSale >= 2) {
            console.log('SellPosterModal - User has exceeded free limit, showing subscription modal');
            setShowSubscriptionModal(true);
          } else {
            console.log('SellPosterModal - User can sell poster, showing sell form');
          }
        } else {
          console.error('SellPosterModal - Failed to get user stats:', response.status);
        }
      } catch (error) {
        console.error('SellPosterModal - Error checking user eligibility:', error);
      }
    };

    checkUserEligibility();
  }, [isOpen, userEmail]);

  const handleSellPoster = async () => {
    if (!posterPath || !userEmail) {
      toast({
        title: "Error",
        description: "Missing poster information. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user can sell poster before proceeding
    if (userStats && !userStats.isSubscribed && userStats.postersForSale >= 2) {
      // User has already used both their free poster sales - show subscription modal
      setShowSubscriptionModal(true);
      return;
    }
    
    if (!agreedToTerms) {
      toast({
        title: "Agreement Required",
        description: "You must agree to the terms and conditions to sell your poster.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!posterName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your poster.",
        variant: "destructive",
      });
      return;
    }

    if (!city.trim()) {
      toast({
        title: "City Required",
        description: "Please enter the city where the poster was created.",
        variant: "destructive",
      });
      return;
    }

    // Validate limited edition inputs (all posters are now limited edition)
    const supplyNum = parseInt(totalSupply);
    const priceNum = parseFloat(pricePerUnit);
    
    if (isNaN(supplyNum) || supplyNum < 1 || supplyNum > 1000) {
      toast({
        title: "Invalid Supply",
        description: "Limited editions must have between 1 and 1000 prints.",
        variant: "destructive",
      });
      return;
    }
    
    if (isNaN(priceNum) || priceNum < 29.95) {
      toast({
        title: "Invalid Price",
        description: "Limited editions must be priced at least 29.95 CHF.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Extract the filename from the thumbnail URL
      console.log("Poster path:", posterPath);
      const urlMatch = posterPath.match(/\/api\/storage-image\/users\/([^\/]+)\/thumbnails\/([^?]+)/);
      
      if (urlMatch) {
        const thumbnailPath = `users/${userEmail}/thumbnails/${urlMatch[2]}`;
        console.log("Thumbnail path:", thumbnailPath);
        console.log("User email:", userEmail);
        
        // First, get the image ID from the user's images by matching thumbnail path
        const userImagesResponse = await apiRequest('GET', `/api/user-images?email=${encodeURIComponent(userEmail)}`);
        
        if (!userImagesResponse.ok) {
          throw new Error(`Failed to fetch user images: ${userImagesResponse.status}`);
        }
        
        const userImagesData = await userImagesResponse.json();
        const matchingImage = userImagesData.images.find((img: any) => 
          img.thumbnailPath === thumbnailPath
        );
        
        if (!matchingImage) {
          throw new Error("Could not find image to publish");
        }
        
        // Validate moment link if provided
        if (momentLink.trim()) {
          try {
            new URL(momentLink.trim());
          } catch {
            toast({
              title: "Invalid Link",
              description: "Please enter a valid URL for the moment link.",
              variant: "destructive",
            });
            setIsSubmitting(false);
            return;
          }
        }

        // Use the correct API endpoint with image ID and supply/pricing data
        const requestData: any = { 
          isPublic: true,
          name: posterName.trim() || null,
          momentLink: momentLink.trim() || null,
          city: city.trim(),
          totalSupply: parseInt(totalSupply),
          pricePerUnit: parseFloat(pricePerUnit)
        };
        
        const response = await apiRequest('PATCH', `/api/images/${matchingImage.id}/public`, requestData);
        
        console.log("API response status:", response.status);
        console.log("API response ok:", response.ok);
        
        if (response.ok) {
          // Small delay to ensure database transaction completes
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Refresh user stats after successful publication
          const refreshResponse = await apiRequest('GET', `/api/user-poster-stats?email=${encodeURIComponent(userEmail)}&t=${Date.now()}`);
          if (refreshResponse.ok) {
            const updatedStats = await refreshResponse.json();
            console.log('Updated user stats after publication:', updatedStats);
            setUserStats(updatedStats);
          }
          
          const successMessage = `Your limited edition poster (${totalSupply} prints at ${pricePerUnit} CHF each) is now available in the catalogue!`;
            
          toast({
            title: "Success!",
            description: successMessage,
            variant: "default",
            duration: 4000,
          });
          onSuccess?.();
          
          // Auto-close modal after toast finishes (4 seconds + small buffer)
          setTimeout(() => {
            onClose();
          }, 4500);
        } else {
          const errorText = await response.text();
          console.error("API error response:", errorText);
          throw new Error(`Failed to set image as public: ${response.status} ${errorText}`);
        }
      } else {
        console.error("URL regex failed for:", posterPath);
        toast({
          title: "Error",
          description: "Invalid poster URL format. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error setting image as public:", error);
      toast({
        title: "Error",
        description: `There was a problem making your image public: ${(error as Error).message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="w-[calc(100%-1rem)] sm:max-w-md max-h-[90vh] overflow-y-auto bg-black border-gray-800 hide-default-close">
          {/* Custom close button to match cart modal */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-400 hover:text-white z-50"
            aria-label="Close"
          >
            <XCircle size={24} />
          </button>
          
          <DialogHeader>
            <DialogTitle className="text-xl text-center text-white font-racing-sans">Sell your poster</DialogTitle>
            <DialogDescription className="text-center text-gray-300">
              Add your poster to our catalogue where others can purchase it.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center my-4">
            {posterPath && (
              <div 
                className="relative shadow-lg bg-white rounded-sm overflow-hidden"
                style={{ 
                  maxWidth: "200px",
                  padding: "8%",
                  aspectRatio: "1/1.414" // A3 aspect ratio
                }}
              >
                <div 
                  className="absolute inset-0 m-[8%]"
                  style={{
                    backgroundImage: `url(${posterPath})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-4 text-gray-300 text-center">
            <p>We handle all production, fulfillment, and delivery — you focus on creating.</p>
          </div>

          {/* Poster Name Section */}
          <div className="space-y-4 border-t border-gray-800 pt-4">
            <div className="space-y-2">
              <Label htmlFor="posterName" className="text-white text-sm font-medium">Name your Poster</Label>
              <Input
                id="posterName"
                type="text"
                value={posterName}
                onChange={(e) => setPosterName(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="Enter a name for your poster"
                maxLength={100}
                required
              />
            </div>

            {/* Link to Moment Section */}
            <div className="space-y-2">
              <Label htmlFor="momentLink" className="text-white text-sm font-medium">Link to Moment (optional)</Label>
              <Input
                id="momentLink"
                type="url"
                value={momentLink}
                onChange={(e) => setMomentLink(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="Instagram, TikTok, YouTube or other links"
                maxLength={500}
              />
            </div>

            {/* City Section */}
            <div className="space-y-2">
              <Label htmlFor="city" className="text-white text-sm font-medium">Enter city</Label>
              <Input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="Enter a city name"
                maxLength={100}
                required
              />
            </div>
          </div>

          {/* Limited Edition Controls */}
          <div className="space-y-4 border-t border-gray-800 pt-4">
            <div className="space-y-3">
              <Label className="text-white text-sm font-medium">Limited Edition Details</Label>
              <p className="text-xs text-gray-400">Every poster is a limited edition collectible</p>
            </div>

            {/* Limited Edition Options */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalSupply" className="text-white text-sm">Total Supply</Label>
                  <Input
                    id="totalSupply"
                    type="text"
                    value={totalSupply}
                    onChange={(e) => setTotalSupply(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="50"
                  />
                  <p className="text-xs text-gray-400">1-1000 prints</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricePerUnit" className="text-white text-sm">Price (CHF)</Label>
                  <Input
                    id="pricePerUnit"
                    type="text"
                    value={pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="45.00"
                  />
                  <p className="text-xs text-gray-400">Min. 29.95 CHF</p>
                </div>
              </div>
              
              <div className="bg-amber-900/20 border border-amber-800/50 rounded-md p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-amber-200">
                    <p className="font-medium mb-1">Limited Edition Terms:</p>
                    <p>Supply limit cannot be changed after publishing. Each buyer will receive a numbered edition.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col space-y-4 mt-4">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="terms" 
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                className="mt-1"
              />
              <Label 
                htmlFor="terms" 
                className="text-sm text-gray-300 font-normal cursor-pointer"
              >
                By clicking Sell my Poster I agree to the <button 
                  onClick={(e) => {
                    e.preventDefault();
                    setShowTerms(true);
                  }} 
                  className="text-[#f1b917] underline hover:text-[#f1b917]/80 cursor-pointer"
                >
                  terms and conditions
                </button>.
              </Label>
            </div>
            
            <Button 
              className="px-6 py-3 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-base w-full flex items-center justify-center"
              onClick={handleSellPoster}
              disabled={isSubmitting}
            >
              <Tag size={16} className="mr-2" /> 
              {isSubmitting ? "Processing..." : "Sell my Poster"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Terms and Conditions Dialog */}
      <TermsDialog isOpen={showTerms} onClose={() => setShowTerms(false)} />
      
      {/* Subscription Modal */}
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => {
          setShowSubscriptionModal(false);
          // Close the sell poster modal too since user can't sell without subscription
          onClose();
        }}
        email={userEmail || ""}
        onSubscriptionComplete={() => {
          setShowSubscriptionModal(false);
          // Refresh user stats after subscription
          if (userEmail) {
            const refreshStats = async () => {
              try {
                const response = await apiRequest('GET', `/api/user-poster-stats?email=${encodeURIComponent(userEmail)}`);
                if (response.ok) {
                  const stats = await response.json();
                  setUserStats(stats);
                }
              } catch (error) {
                console.error('Error refreshing user stats:', error);
              }
            };
            refreshStats();
          }
        }}
      />
    </>
  );
}