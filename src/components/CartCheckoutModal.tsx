import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { XCircle, Trash2, ShoppingCart, Check, ArrowLeft, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/Button";
import {
  Carousel,
  CarouselContent,
  CarouselItem
} from "@/components/ui/carousel";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import ShippingForm from "@/components/ShippingForm";
import CheckoutForm from "@/components/CheckoutForm";
import { apiRequest } from "@/lib/queryClient";
import { trackCheckoutStep, trackEvent, trackTransaction } from "@/lib/analytics";
import Confetti from "react-confetti";

// Make sure to load stripe outside of components
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Define the different steps for the checkout process
type CheckoutStep = "cart" | "shipping" | "payment" | "confirmation";

interface CartCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartCheckoutModal({
  isOpen,
  onClose,
}: CartCheckoutModalProps) {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const { toast } = useToast();
  const [selectedPoster, setSelectedPoster] = useState<number | null>(
    cartItems.length > 0 ? 0 : null
  );
  
  // State for checkout flow
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
  const [shippingData, setShippingData] = useState<any>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processingPaymentStatus, setProcessingPaymentStatus] = useState("");
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderedItems, setOrderedItems] = useState<any[]>([]);
  
  // Window dimensions for confetti
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });
  
  // Update window dimensions when window is resized
  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Reset state when modal opens, but preserve order completion state when needed
  useEffect(() => {
    // Only reset if we're not in the middle of processing an order
    if (isOpen && !orderCompleted) {
      setSelectedPoster(cartItems.length > 0 ? 0 : null);
      setCurrentStep("cart");
      setShippingData(null);
      setStripeClientSecret(null);
      setConfirmationId(null);
      setIsProcessingPayment(false);
      setProcessingPaymentStatus("");
    }
  }, [isOpen, cartItems.length, orderCompleted]);

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
    
    // If cart becomes empty, go back to cart view
    if (cartItems.length <= 1) {
      setCurrentStep("cart");
    }
  };
  
  // Handler for when shipping form is completed
  const handleShippingComplete = async (data: any) => {
    // Save shipping data
    setShippingData(data);
    setIsProcessingPayment(true);
    
    try {
      // Prepare the checkout by sending shipping data and getting a client secret
      const response = await apiRequest("POST", "/api/prepare-checkout", {
        ...data,
        quantity: cartItems.reduce((total, item) => total + item.quantity, 0), // Pass the total quantity including multiples
      });
      
      if (!response.ok) {
        throw new Error("Failed to prepare checkout");
      }
      
      const result = await response.json();
      
      // Set the Stripe client secret for payment
      setStripeClientSecret(result.clientSecret);
      setIsProcessingPayment(false);
      
      // Move to payment step
      setCurrentStep("payment");
      
      // Track checkout step 2 (payment step)
      trackCheckoutStep(2, "payment_step_entered");
      trackEvent("Checkout", "step_2");
      
    } catch (error) {
      console.error("Error preparing checkout:", error);
      toast({
        title: "Checkout Error",
        description: "There was a problem preparing your checkout. Please try again.",
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
  };
  
  // Handler for when payment is completed
  const handlePaymentComplete = async (paymentIntentId?: string) => {
    try {
      // Set processing status
      setProcessingPaymentStatus("Processing payment...");
      
      // Track successful payment
      trackEvent("Checkout", "payment_success", paymentIntentId);
      trackEvent("Checkout", "step_4");
      
      // First, make sure we set the order as completed and move to confirmation step
      // CRITICAL: Do this BEFORE clearing the cart or any other operations
      setOrderCompleted(true);
      setCurrentStep("confirmation");
      
      // Create order for each item in the cart
      setProcessingPaymentStatus("Creating your order...");
      
      // Save a copy of the cart items for display in the order confirmation
      // IMPORTANT: Do this before clearing the cart
      const currentItems = [...cartItems];
      setOrderedItems(currentItems);
      
      // Calculate the total order amount based on quantities
      const totalAmount = currentItems.reduce((total, item) => total + (item.quantity * 0.60), 0);
      setOrderTotal(totalAmount);
      
      // Create a single order for the entire cart with all items
      const orderConfirmationId = stripeClientSecret?.split('_secret')[0] || `CAT-${Math.floor(100000 + Math.random() * 900000)}`;
      
      // CRITICAL: Set confirmation ID early to ensure it's visible
      setConfirmationId(orderConfirmationId);
      
      // Prepare cart items data to send to server
      const cartItemsData = currentItems.map(item => ({
        imageUrl: item.fullImageUrl, // Use full-quality URL for printing
        style: item.style,
        quantity: item.quantity || 1
      }));
      
      // Complete the cart order with a single API call
      const orderResponse = await apiRequest("POST", "/api/complete-catalogue-order", {
        ...shippingData,
        cartItems: cartItemsData,
        orderConfirmationId,
        paymentIntentId
      });
      
      if (!orderResponse.ok) {
        throw new Error(`Cart order creation failed: ${orderResponse.status}`);
      }
      
      const orderResult = await orderResponse.json();
      
      // Update the confirmation ID if server provided a different one
      if (orderResult.confirmationId) {
        setConfirmationId(orderResult.confirmationId);
      }
      
      // Don't clear the cart yet - we'll clear it when the user clicks "Done"
      
      // Track the order in analytics
      try {
        const simpleItems = [
          {
            name: 'A3 Poster',
            price: 0.60,
            quantity: currentItems.length,
            category: 'Poster'
          }
        ];
        
        trackTransaction(
          orderResult.confirmationId || orderConfirmationId,
          totalAmount,
          0, // shipping cost
          simpleItems
        );
      } catch (analyticsError) {
        console.error('Error tracking analytics:', analyticsError);
      }
      
      // Track order completion
      trackEvent("Checkout", "order_completed", orderResult.confirmationId || orderConfirmationId);
      
      // Clear processing status now that everything is done
      setProcessingPaymentStatus("");
      
      console.log("Order completed successfully:", {
        confirmationId: orderResult.confirmationId || orderConfirmationId,
        orderTotal: totalAmount,
        orderedItems: currentItems.length,
        step: "confirmation",
        orderCompleted: true
      });
      
    } catch (error) {
      console.error("Error completing order:", error);
      setProcessingPaymentStatus("");
      // Don't change the current step if there's an error
      setOrderCompleted(false); 
      toast({
        title: "Order Error",
        description: "There was a problem creating your order. Please contact support.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="top-[50%] translate-y-[-50%] w-[90vw] max-w-md sm:max-w-xl md:max-w-2xl max-h-[90vh] p-0 bg-black border-gray-800 overflow-auto">
        <VisuallyHidden>
          <DialogTitle>Your Cart</DialogTitle>
          <DialogDescription>Items in your shopping cart</DialogDescription>
        </VisuallyHidden>
        
        <div className="relative w-full h-full flex flex-col items-center p-4">
          {/* Close button - only show in cart view or after order completion */}
          {(currentStep === "cart" || currentStep === "confirmation") && (
            <DialogClose className="absolute top-2 right-2 text-gray-400 hover:text-white z-50" onClick={onClose}></DialogClose>
          )}
          
          {/* Back button - only show during shipping & payment steps */}
          {(currentStep === "shipping" || currentStep === "payment") && (
            <button
              onClick={() => {
                if (currentStep === "shipping") {
                  setCurrentStep("cart");
                } else if (currentStep === "payment") {
                  setCurrentStep("shipping");
                }
              }}
              className="absolute top-2 left-2 text-gray-400 hover:text-white z-50 flex items-center"
              aria-label="Back"
            >
              <ArrowLeft size={20} className="mr-1" />
              <span className="text-sm">Back</span>
            </button>
          )}
          
          {/* Cart View */}
          {currentStep === "cart" && (
            <>
              {/* Cart Header */}
              <div className="w-full text-center mb-4">
                <h2 className="text-2xl text-white font-racing-sans">Your Cart</h2>
                <p className="text-gray-400">
                  {cartItems.length === 0
                    ? "Your cart is empty"
                    : cartItems.length === 1
                    ? "1 poster in your cart"
                    : `${cartItems.length} posters in your cart`}
                </p>
              </div>
              
              {/* Cart Content */}
              <div className="w-full flex-1">
                {cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48">
                    <p className="text-gray-400 mb-4">No items in your cart</p>
                    <Button 
                      onClick={onClose}
                      className="bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200"
                    >
                      Browse Catalogue
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Poster Carousel - Horizontal Slider */}
                    <Carousel 
                      className="w-full mb-6 overflow-hidden"
                      opts={{
                        align: "center", // Center alignment
                        dragFree: true,
                        containScroll: "trimSnaps",
                        loop: false,
                        // Start in the middle to show scrollability in both directions
                        startIndex: Math.min(Math.floor(cartItems.length / 2), cartItems.length - 1)
                      }}
                    >
                      <CarouselContent className="px-2">
                        {cartItems.map((item, index) => (
                          <CarouselItem 
                            key={item.id} 
                            className="basis-1/2 pl-1 pr-1 md:basis-1/3"
                          >
                            <div className="flex flex-col items-center">
                              {/* Poster with white border - Museum style display */}
                              <div className="relative w-full flex justify-center">
                                <div 
                                  className="relative shadow-lg bg-white rounded-sm overflow-hidden hover:shadow-2xl transition-shadow duration-300"
                                  style={{ 
                                    width: "100%",
                                    maxWidth: "140px",
                                    padding: "8%",
                                    aspectRatio: "1/1.414" // A3 aspect ratio
                                  }}
                                >
                                  <div 
                                    className="absolute inset-0 m-[8%]"
                                    style={{
                                      backgroundImage: `url(${import.meta.env.VITE_API_URL + item.imageUrl})`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                    }}
                                  />
                                </div>
                              </div>
                              
                              {/* Quantity controls and remove button */}
                              <div className="w-full flex justify-center items-center mt-3 space-x-2">
                                {/* Quantity controls - disabled for limited editions */}
                                <div className="flex flex-col items-center">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    disabled={item.isLimitedEdition}
                                    className={`p-1 h-6 ${item.isLimitedEdition ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                                  >
                                    <ChevronUp className="w-3 h-3" />
                                  </Button>
                                  <div className="flex flex-col items-center">
                                    <span className="text-white text-sm font-medium px-2">{item.quantity}</span>
                                    {item.isLimitedEdition && (
                                      <span className="text-xs text-yellow-400 font-medium">Limited Edition</span>
                                    )}
                                  </div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    disabled={item.isLimitedEdition}
                                    className={`p-1 h-6 ${item.isLimitedEdition ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                                  >
                                    <ChevronDown className="w-3 h-3" />
                                  </Button>
                                </div>
                                
                                {/* Remove button */}
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                    </Carousel>
                    
                    {/* Cart Summary */}
                    <div className="mt-6 border-t border-gray-800 pt-4 w-full px-2 sm:px-4 box-border">
                      <div className="flex flex-col space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Subtotal ({cartItems.reduce((total, item) => total + item.quantity, 0)} {cartItems.reduce((total, item) => total + item.quantity, 0) === 1 ? 'A3 poster' : 'A3 posters'}):</span>
                          <span className="text-white text-sm font-medium">CHF {cartTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300 text-sm">Shipping:</span>
                          <span className="text-white text-sm font-medium">Included</span>
                        </div>
                        <div className="flex justify-between items-center font-medium">
                          <span className="text-gray-200 text-sm">Total:</span>
                          <span className="text-[#f1b917] text-sm">CHF {cartTotal.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="text-center mb-3">
                        <p className="text-gray-300 text-xs">
                          Printed in Switzerland 🇨🇭 Delivered to your door.
                        </p>
                      </div>
                      
                      <div className="text-center">
                        <Button 
                          className="bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 px-8 py-2"
                          onClick={() => {
                            setCurrentStep("shipping");
                            trackCheckoutStep(1, "shipping_step_entered");
                            trackEvent("Checkout", "step_1");
                          }}
                        >
                          Checkout
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
          
          {/* Shipping Step */}
          {currentStep === "shipping" && (
            <div className="w-full max-w-md mx-auto py-6">
              <h2 className="text-xl text-white text-center mb-4 font-notosans">Shipping Information</h2>
              <ShippingForm 
                onSubmit={handleShippingComplete} 
                isProcessing={isProcessingPayment}
              />
            </div>
          )}
          
          {/* Payment Step */}
          {currentStep === "payment" && stripeClientSecret && (
            <div className="w-full max-w-md mx-auto py-6">
              <h2 className="text-xl text-white text-center mb-4 font-notosans">Payment</h2>
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret: stripeClientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#f1b917',
                      colorBackground: '#1e1e1e',
                      colorText: '#ffffff',
                      colorDanger: '#ef4444',
                      fontFamily: 'system-ui, sans-serif',
                      spacingUnit: '4px',
                      borderRadius: '4px',
                    },
                    rules: {
                      '.Label': {
                        marginBottom: '8px',
                        color: '#ffffff',
                        fontWeight: '500',
                      },
                      '.Input': {
                        padding: '12px',
                        color: '#ffffff',
                      },
                      '.Link': {
                        display: "none",
                      },
                    },
                  },
                }}
              >
                <CheckoutForm
                  onPaymentComplete={handlePaymentComplete}
                  processingStatus={processingPaymentStatus}
                />
              </Elements>
            </div>
          )}
          
          {/* Order Confirmation Step */}
          {currentStep === "confirmation" && orderCompleted && (
            <div className="w-full text-center py-8">
              {/* Confetti animation */}
              <Confetti
                width={windowDimensions.width}
                height={windowDimensions.height}
                recycle={false}
                numberOfPieces={500}
                gravity={0.2}
                confettiSource={{
                  x: windowDimensions.width / 2,
                  y: 0,
                  w: 0,
                  h: 0,
                }}
                style={{ position: "fixed", top: 0, left: 0, zIndex: 100 }}
              />
              
              <div className="bg-[#f1b917]/10 rounded-full p-4 mb-4 mx-auto w-20 h-20 flex items-center justify-center">
                <Check size={32} className="text-[#f1b917]" />
              </div>
              
              <h2 className="text-2xl text-white mb-4 font-racing-sans">Order Confirmed!</h2>
              
              <div className="max-w-lg mx-auto">
                <p className="text-gray-300 mb-4">
                  Thank you for your order! Your A3 posters will be printed in Switzerland 
                  on premium paper and delivered to your address.
                </p>
                
                {confirmationId && (
                  <div className="bg-gray-900 rounded-lg p-4 mb-4 inline-block">
                    <p className="text-sm text-gray-400">Order Reference</p>
                    <p className="text-[#f1b917] text-lg font-bold">
                      {/* Only show the CAT order ID, not the Stripe reference */}
                      {confirmationId.startsWith('CAT-') ? confirmationId : 
                       `CAT-${Math.floor(100000 + Math.random() * 900000)}`}
                    </p>
                  </div>
                )}
                
                <div className="bg-gray-900 rounded-lg p-6 mb-6 text-left">
                  <h3 className="text-xl mb-4 text-[#f1b917] font-racing-sans">Order Details</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400 block text-sm">Name:</span>
                      <span className="text-white">{shippingData?.firstName} {shippingData?.lastName}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-sm">Email:</span>
                      <span className="text-white">{shippingData?.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-sm">Items:</span>
                      <span className="text-white">{orderedItems.reduce((total, item) => total + (item.quantity || 1), 0)} posters</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block text-sm">Total Amount:</span>
                      <span className="text-white">CHF {orderTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-400 mb-6">
                  We'll process your order right away and send you an email with shipping details.
                </p>
                
                <Button 
                  className="px-6 py-2 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200"
                  onClick={() => {
                    // Clear the cart when the user clicks "Done"
                    clearCart();
                    // Reset order completion state
                    setOrderCompleted(false);
                    setCurrentStep("cart");
                    setConfirmationId(null);
                    setOrderedItems([]);
                    onClose();
                  }}
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}