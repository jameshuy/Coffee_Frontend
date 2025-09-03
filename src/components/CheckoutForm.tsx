import { useState, useEffect } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/Button";
import { toast } from "@/hooks/use-toast";
import { trackCheckoutStep, trackEvent, trackTransaction } from "@/lib/analytics";
import { ArrowLeft } from "lucide-react";

interface CheckoutFormProps {
  onPaymentComplete: (paymentIntentId?: string) => void;
  processingStatus?: string;
  onBack?: () => void;
}

export default function CheckoutForm({ onPaymentComplete, processingStatus, onBack }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  // When Stripe is loaded, get the PaymentIntent ID for later use
  useEffect(() => {
    if (stripe) {
      const clientSecret = new URLSearchParams(window.location.search).get(
        "payment_intent_client_secret"
      );
      
      if (clientSecret) {
        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
          if (paymentIntent) {
            setPaymentIntentId(paymentIntent.id);
          }
        });
      }
    }
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    // Track payment attempt - step 2 in checkout flow
    trackCheckoutStep(2, 'payment_initiated');
    trackEvent('Checkout', 'payment_attempt');
    
    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin, // In case of redirect
          payment_method_data: {
            // Explicitly prevent Link autofill
            billing_details: {} 
          }
          // Note: payment_method_options removed due to TypeScript errors
        },
        redirect: "if_required",
      });

      if (error) {
        // Track payment failure
        trackEvent('Payment', 'failed', error.message);
        trackEvent('Error', 'payment_failure', error.type);
        
        toast({
          title: "Payment Failed",
          description: error.message || "An error occurred during payment processing.",
          variant: "destructive",
        });
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Track successful payment - step 3 in checkout flow (completed)
        trackCheckoutStep(3, 'payment_completed');
        
        // Track the transaction with basic ecommerce data
        trackTransaction(
          paymentIntent.id,
          29.95, // Total amount (CHF 29.95 with free shipping)
          0,    // Shipping cost (free)
          [{ name: 'A3 Poster', price: 29.95, quantity: 1, category: 'Poster' }]
        );
        
        // Pass the payment intent ID back to the parent component
        setPaymentIntentId(paymentIntent.id);
        // Payment succeeded
        onPaymentComplete(paymentIntent.id);
      } else {
        // Track pending payment status
        trackEvent('Payment', 'pending', paymentIntent?.status);
        
        toast({
          title: "Payment Status",
          description: "Your payment is being processed.",
        });
      }
    } catch (e) {
      console.error("Payment error:", e);
      
      // Track unexpected payment error
      trackEvent('Error', 'payment_exception', e instanceof Error ? e.message : 'Unknown error');
      trackEvent('Payment', 'exception');
      
      toast({
        title: "Payment Error",
        description: "An unexpected error occurred during payment processing.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="mb-6">
        <PaymentElement options={{
          // Include all available payment methods, with card at the top
          paymentMethodOrder: ['card', 'twint', 'klarna', 'ideal', 'sofort', 'sepa_debit', 'eps'],
          // Only use supported StripePaymentElementOptions properties
          defaultValues: {
            billingDetails: {
              name: '',
              email: '',
              phone: '',
              address: {
                line1: '',
                line2: '',
                city: '',
                state: '',
                postal_code: '',
                country: ''
              }
            }
          }
        }} />
      </div>
      
      {processingStatus ? (
        <div className="text-center p-4 bg-gray-800/50 border border-gray-700 rounded-lg mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f1b917] mx-auto mb-2"></div>
          <p className="text-gray-300">{processingStatus}</p>
        </div>
      ) : (
        <div className="flex space-x-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              disabled={isProcessing}
              className={`bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 py-3 px-4 flex items-center justify-center ${
                isProcessing ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className={`flex-1 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 py-3 px-4 flex items-center justify-center ${
              isProcessing || !stripe ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
                Processing...
              </>
            ) : (
              <>
                Pay Now
              </>
            )}
          </button>
        </div>
      )}
    </form>
  );
}