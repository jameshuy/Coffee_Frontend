import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { trackEvent, trackTransaction } from "@/lib/analytics";

export interface ShippingInfo {
  firstName: string;
  lastName: string;
  address: string;
  zipCode: string;
  city: string;
  state: string;
  country: string;
  email: string;
}

export interface PaymentInfo {
  clientSecret: string | null;
  confirmationId: string | null;
}

export interface OrderSummary {
  posterPrice: number;
  shipping: number;
  total: number;
  quantity: number;
}

export const useOrderFlow = () => {
  // Shipping state
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo | null>(null);
  
  // Payment state
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    clientSecret: null,
    confirmationId: null,
  });
  
  // Order processing state
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [processingPaymentStatus, setProcessingPaymentStatus] = useState("");
  
  // Order completion state
  const [orderCompleted, setOrderCompleted] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Quantity state
  const [quantity, setQuantity] = useState(1);
  
  // Calculate order summary
  const calculatePosterPrice = () => (29.95 * quantity).toFixed(2);
  const calculateShipping = () => (0.0).toFixed(2); // Free shipping
  const calculateTotal = () => (29.95 * quantity).toFixed(2); // Poster price with free shipping
  
  const orderSummary: OrderSummary = {
    posterPrice: parseFloat(calculatePosterPrice()),
    shipping: parseFloat(calculateShipping()),
    total: parseFloat(calculateTotal()),
    quantity,
  };

  // Handle shipping form completion
  const handleShippingComplete = async (data: ShippingInfo) => {
    setIsProcessingPayment(true);
    setShippingInfo(data);
    setError(null);

    // Track checkout step
    trackEvent("Checkout", "shipping_completed", data.country);
    trackEvent("Checkout", "step_2");

    try {
      // Create a new payment intent when shipping info is submitted
      const response = await apiRequest("POST", "/api/prepare-checkout", {
        ...data,
        quantity: quantity, // Include quantity for calculating correct payment amount
      });

      const { clientSecret, confirmationId } = await response.json();

      setPaymentInfo({
        clientSecret,
        confirmationId,
      });
      
      // Track payment form loaded
      trackEvent("Checkout", "payment_ready", `quantity:${quantity}`);
      trackEvent("Checkout", "step_3");
    } catch (error) {
      console.error("Error preparing checkout:", error);
      setError("There was a problem preparing your checkout. Please try again.");

      // Track checkout error
      trackEvent("Checkout", "error", "checkout_preparation_failed");

      toast({
        title: "Error",
        description: "There was a problem preparing your checkout. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle payment completion
  const handlePaymentComplete = async (
    paymentIntentId?: string,
    generatedPosterUrl?: string,
    originalImageUrl?: string,
    selectedStyle?: string
  ) => {
    try {
      // Step 1: Confirm the payment was successful (this is already done by Stripe)
      console.log("Payment successful with ID:", paymentIntentId);
      setProcessingPaymentStatus("Processing payment...");

      // Track successful payment
      trackEvent("Checkout", "payment_success", paymentIntentId);
      trackEvent("Checkout", "step_4");

      // Use both the generated poster URL and original image URL
      const posterImagePath = generatedPosterUrl;
      const originalImagePath = originalImageUrl;

      console.log("Using generated poster URL:", posterImagePath);
      console.log("Using original image URL:", originalImagePath);

      setProcessingPaymentStatus("Completing your order...");

      // Complete the order
      const orderResponse = await apiRequest("POST", "/api/complete-order", {
        paymentIntentId,
        confirmationId: paymentInfo.confirmationId,
        shippingData: shippingInfo,
        imageUrl: posterImagePath,
        originalImageUrl: originalImagePath,
        style: selectedStyle, // Include the selected style information
        quantity: quantity, // Include quantity information
      });

      const orderData = await orderResponse.json();
      console.log("Order created successfully:", orderData);

      // Track transaction completion and purchase
      trackTransaction(
        paymentInfo.confirmationId || "unknown",
        parseFloat(calculateTotal()),
        5.0, // shipping cost
        [
          {
            name: `Custom A3 Poster - ${selectedStyle || "Default"} Style`,
            price: 15.0,
            quantity: quantity,
            category: "Poster",
          },
        ],
      );
      trackEvent(
        "Checkout",
        "order_completed",
        `style:${selectedStyle || "default"},qty:${quantity}`,
      );
      trackEvent("Checkout", "step_complete");

      // Show confirmation
      setProcessingPaymentStatus("");
      setOrderNumber(paymentInfo.confirmationId);
      setOrderCompleted(true);
      setError(null);
    } catch (error) {
      console.error("Error completing order:", error);
      setError("There was a problem completing your order. Please contact support.");

      // Track error
      trackEvent("Checkout", "error", "order_completion_failed");

      toast({
        title: "Error",
        description: "There was a problem completing your order. Please contact support.",
        variant: "destructive",
      });
    }
  };

  // Handle placing order (transition to shipping step)
  const handlePlaceOrder = () => {
    setError(null);
    // This function is called when the "Order Poster" button is clicked
    // The actual step transition is handled in the parent component
    trackEvent("Purchase", "order_poster_click");
  };

  // Reset order state for new orders
  const resetOrderState = () => {
    setShippingInfo(null);
    setPaymentInfo({ clientSecret: null, confirmationId: null });
    setIsPlacingOrder(false);
    setIsProcessingPayment(false);
    setProcessingPaymentStatus("");
    setOrderCompleted(false);
    setOrderNumber(null);
    setError(null);
    setQuantity(1);
  };

  return {
    // State
    shippingInfo,
    setShippingInfo,
    paymentInfo,
    setPaymentInfo,
    orderSummary,
    isPlacingOrder,
    isProcessingPayment,
    processingPaymentStatus,
    orderCompleted,
    orderNumber,
    error,
    quantity,
    setQuantity,
    
    // Calculated values
    calculatePosterPrice,
    calculateShipping,
    calculateTotal,
    
    // Handlers
    handlePlaceOrder,
    handleShippingComplete,
    handlePaymentComplete,
    resetOrderState,
  };
};
