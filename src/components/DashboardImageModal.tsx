import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { XCircle, Eye, EyeOff, ChevronLeft, ChevronRight, Share } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import SellPosterModal from "@/components/SellPosterModal";
import UnpublishConfirmationModal from "@/components/UnpublishConfirmationModal";

import { useAuth } from "@/context/AuthContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ShippingForm from "./ShippingForm";
import CheckoutForm from "./CheckoutForm";
import OrderSummary from "./OrderSummary";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { trackEvent, trackCheckoutStep } from "@/lib/analytics";
import { apiRequest } from "@/lib/queryClient";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

type OrderStep = "idle" | "shipping" | "payment";

interface DashboardImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  fullImageUrl?: string;
  style: string;
  id: string;
  isPublic: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onShare?: (imageUrl: string) => void;
  onOpenSubscriptionModal?: () => void;
}

export default function DashboardImageModal({
  isOpen,
  onClose,
  imageUrl,
  fullImageUrl,
  style,
  id,
  isPublic,
  onNext,
  onPrevious,
  hasPrevious = true,
  hasNext = true,
  onShare,
  onOpenSubscriptionModal,
}: DashboardImageModalProps) {
  const { user } = useAuth();
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isUnpublishConfirmOpen, setIsUnpublishConfirmOpen] = useState(false);
  const [currentIsPublic, setCurrentIsPublic] = useState(isPublic);
  const [imageLoading, setImageLoading] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Order flow state
  const [orderStep, setOrderStep] = useState<OrderStep>("idle");
  const [shippingData, setShippingData] = useState<any>(null);
  const [paymentReady, setPaymentReady] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processingPaymentStatus, setProcessingPaymentStatus] = useState("");
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  // Update local state when prop changes
  useEffect(() => {
    setCurrentIsPublic(isPublic);
  }, [isPublic]);

  // Reset loading state when image changes
  useEffect(() => {
    setImageLoading(true);
  }, [imageUrl, id]);

  // Reset order state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setOrderStep("idle");
      setPaymentReady(false);
      setClientSecret(null);
      setShippingData(null);
      setOrderCompleted(false);
      setOrderNumber("");
      setProcessingPaymentStatus("");
    }
  }, [isOpen]);

  // Handle Order Poster (A3) button click
  const handleOrderPoster = () => {
    setOrderStep("shipping");
    trackEvent("Purchase", "order_poster_click");
  };

  // Handle shipping form completion
  const handleShippingComplete = async (data: any) => {
    setShippingData(data);
    setIsProcessingPayment(true);
    setProcessingPaymentStatus("Creating order...");

    try {
      const response = await apiRequest('POST', '/api/prepare-checkout', {
        ...data,
        quantity: 1,
      });
      const { clientSecret, confirmationId } = await response.json();
      setClientSecret(clientSecret);
      setOrderNumber(confirmationId);
      setPaymentReady(true);
      setOrderStep("payment");
      setProcessingPaymentStatus("");
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
      setProcessingPaymentStatus("");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle payment completion
  const handlePaymentComplete = async (paymentIntentId?: string) => {
    if (!paymentIntentId) return;
    
    setProcessingPaymentStatus("Completing your order...");

    try {
      const response = await apiRequest('POST', '/api/complete-order', {
        paymentIntentId,
        shippingData: shippingData,
        imageUrl: imageUrl.replace('/thumbnails/', '/generated/'),
        originalImageUrl: imageUrl.replace('/thumbnails/', '/originals/').replace(`-${style}`, ''),
        quantity: 1,
        style: style,
        confirmationId: orderNumber,
      });
      const { confirmationId } = await response.json();
      
      trackEvent("Checkout", "order_completed", `style:${style},qty:1`);
      trackEvent("Checkout", "step_complete");

      setProcessingPaymentStatus("");
      setOrderNumber(confirmationId);
      setOrderCompleted(true);
    } catch (error) {
      console.error("Error completing order:", error);
      toast({
        title: "Error",
        description: "There was a problem completing your order. Please contact support.",
        variant: "destructive",
      });
    }
  };

  // Mutation to toggle public status
  const togglePublicMutation = useMutation({
    mutationFn: async (makePublic: boolean) => {
      const response = await apiRequest('PATCH', `/api/images/${id}/public`, { isPublic: makePublic });
      return response.json();
    },
    onSuccess: async (data, makePublic) => {
      // Update local state immediately
      setCurrentIsPublic(makePublic);
      
      // Invalidate and refetch user images
      queryClient.invalidateQueries({ queryKey: ['/api/user-images'] });
      
      // If unpublishing, force refresh user stats to update poster count
      if (!makePublic && user?.email) {
        try {
          // Small delay to ensure database transaction completes
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Add timestamp to bypass cache
          const refreshResponse = await apiRequest('GET', `/api/user-poster-stats?email=${encodeURIComponent(user.email)}&t=${Date.now()}`);
          if (refreshResponse.ok) {
            const updatedStats = await refreshResponse.json();
            console.log('Updated user stats after unpublishing:', updatedStats);
          }
        } catch (error) {
          console.error('Failed to refresh user stats after unpublishing:', error);
        }
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update poster status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePublishToggle = () => {
    if (!currentIsPublic) {
      // Always show sell modal first - it will handle subscription checking internally
      setIsSellModalOpen(true);
    } else {
      // Show confirmation modal before unpublishing
      setIsUnpublishConfirmOpen(true);
    }
  };

  const handleUnpublishConfirm = () => {
    togglePublicMutation.mutate(false);
    setIsUnpublishConfirmOpen(false);
  };

  const handleUnpublishCancel = () => {
    setIsUnpublishConfirmOpen(false);
  };

  const handleSellModalClose = () => {
    setIsSellModalOpen(false);
  };

  const handleSellSuccess = () => {
    // Only update state when sale actually succeeds
    setCurrentIsPublic(true);
    setIsSellModalOpen(false);
    // Refresh data to get updated isPublic status
    queryClient.invalidateQueries({ queryKey: ['/api/user-images'] });
  };

  const handleSubscriptionComplete = () => {
    // Subscription completed - handled by parent component
    // After subscription, reload the page to update user context
    window.location.reload();
  };



  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isOpen) return;
    
    if (event.key === "Escape") {
      onClose();
    } else if (event.key === "ArrowLeft" && hasPrevious && onPrevious) {
      onPrevious();
    } else if (event.key === "ArrowRight" && hasNext && onNext) {
      onNext();
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hasPrevious, hasNext]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className={`top-[50%] translate-y-[-50%] sm:max-w-4xl max-h-[90vh] bg-black border-gray-800 p-0 [&>button]:hidden ${
          orderStep !== "idle" ? "overflow-y-auto" : "overflow-hidden"
        }`}>
          <VisuallyHidden>
            <DialogTitle>Poster with {style} style</DialogTitle>
          </VisuallyHidden>

          {/* Navigation buttons */}
          {hasPrevious && onPrevious && (
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>
          )}
          
          {hasNext && onNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </button>
          )}

        <div className="flex flex-col items-center space-y-6 md:p-6 py-2">
          {/* Image container */}
          <div className="flex justify-center items-center min-h-[300px]">
            {/* Loading spinner */}
            {imageLoading && (
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            
            {/* Image container with white border - only shown when image is loaded */}
            {!imageLoading && (
              <div 
                className="bg-white p-4 md:p-6 shadow-xl rounded-sm"
                style={{ 
                  width: "auto",
                  height: "auto",
                  maxWidth: "90%",
                  maxHeight: "70vh"
                }}
              >
                <img
                  src={imageUrl}
                  alt={`Poster with ${style} style`}
                  className="select-none pointer-events-none"
                  draggable="false"
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    display: "block",
                    maxWidth: "100%",
                    maxHeight: "calc(70vh - 80px)",
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                    userSelect: "none"
                  }}
                />
              </div>
            )}
            
            {/* Hidden image for loading detection */}
            <img
              src={imageUrl}
              alt=""
              className="hidden"
              onLoad={() => setImageLoading(false)}
              onError={() => setImageLoading(false)}
            />
          </div>
          
          {/* Order, Publish/Unpublish, and Close button section */}
          <div className="flex items-center justify-center space-x-1 md:space-x-4 mt-6 w-full max-w-md">
            {/* Order (A3) button */}
            {!orderCompleted && (
              <Button 
                className="px-2 md:px-4 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 flex items-center space-x-2"
                onClick={handleOrderPoster}
                disabled={orderStep !== "idle"}
              >
                <span>{orderStep === "idle" ? "Order (A3)" : "Ordering..."}</span>
              </Button>
            )}
            
            {/* Publish/Unpublish button - available to all users */}
            <Button 
              className="px-2 md:px-4 md:ml-0 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 flex items-center space-x-2"
              onClick={handlePublishToggle}
              disabled={togglePublicMutation.isPending}
            >
              {currentIsPublic ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  <span>{togglePublicMutation.isPending ? "Unpublishing..." : "Unpublish"}</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span>{togglePublicMutation.isPending ? "Publishing..." : "Publish"}</span>
                </>
              )}
            </Button>
            
            {/* Custom close button */}
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <XCircle size={20} />
            </button>
          </div>

          {/* Shipping & Payment Flow */}
          {orderStep === "shipping" && !orderCompleted && (
            <div className="w-full mt-8 max-w-md px-2">
              {/* Order Summary */}
              <OrderSummary />
              
              <h2 className="text-xl md:text-2xl font-racing-sans mb-6 text-center text-white">
                Shipping Information
              </h2>
              
              <ShippingForm
                imageDataUrl={imageUrl}
                onSuccess={handleShippingComplete}
                hideSubmitButton={true}
                isProcessing={isProcessingPayment}
              />

              {/* Separate payment button */}
              <div className="pt-4 mb-8">
                <Button
                  onClick={() => {
                    const submitButton = document.getElementById("shipping-form-submit") as HTMLButtonElement;
                    if (submitButton) {
                      submitButton.click();
                    }
                  }}
                  className="w-full py-3 px-4 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-lg"
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <div className="flex items-center justify-center">
                      <span className="animate-spin mr-2 h-4 w-4 border-2 border-t-transparent rounded-full"></span>
                      Processing...
                    </div>
                  ) : (
                    "Proceed to Payment"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Payment Flow */}
          {orderStep === "payment" && paymentReady && clientSecret && !orderCompleted && (
            <div className="w-full mt-8 max-w-md">
              <h2 className="text-xl md:text-2xl font-racing-sans mb-6 text-center text-white">
                Payment
              </h2>
              
              <Elements 
                stripe={stripePromise} 
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#f1b917',
                      colorBackground: '#1f2937',
                      colorText: '#ffffff',
                      colorDanger: '#df1b41',
                      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                      spacingUnit: '4px',
                      borderRadius: '6px',
                    },
                  },
                }}
              >
                <CheckoutForm 
                  onPaymentComplete={handlePaymentComplete}
                  processingStatus={processingPaymentStatus}
                  onBack={() => setOrderStep("shipping")}
                />
              </Elements>
            </div>
          )}

          {/* Order Completion */}
          {orderCompleted && orderNumber && (
            <div className="w-full mt-8 max-w-md text-center">
              <div className="bg-green-900/30 border border-green-800 rounded-md px-6 py-8">
                <h2 className="text-xl font-racing-sans text-green-400 mb-4">
                  Order Confirmed!
                </h2>
                <p className="text-gray-300 mb-2">
                  Your order number is:
                </p>
                <p className="text-white font-mono text-lg">
                  {orderNumber}
                </p>
                <p className="text-gray-400 text-sm mt-4">
                  We'll send you an email confirmation shortly.
                </p>
              </div>
            </div>
          )}
        </div>
        </DialogContent>
      </Dialog>

      {/* Sell Poster Modal */}
      <SellPosterModal
        isOpen={isSellModalOpen}
        onClose={handleSellModalClose}
        onSuccess={handleSellSuccess}
        userEmail={user?.email || null}
        posterPath={fullImageUrl || imageUrl}
      />

      {/* Unpublish Confirmation Modal */}
      <UnpublishConfirmationModal
        isOpen={isUnpublishConfirmOpen}
        onClose={handleUnpublishCancel}
        onConfirm={handleUnpublishConfirm}
        isUnpublishing={togglePublicMutation.isPending}
      />

    </>
  );
}