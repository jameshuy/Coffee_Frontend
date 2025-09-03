import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { X, Package, Check } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';

// Make sure to call loadStripe outside of a component's render to avoid recreating the Stripe object on every render
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onSubscriptionComplete: () => void;
}

// Subscription option
const subscriptionPlan = {
  id: 'artistic_collective',
  name: 'Membership',
  price: 9.99,
  description: 'Unlimited creations'
};

function CheckoutForm({ email, onSubscriptionComplete, onClose, clientSecret, finalPrice, discountApplied }: {
  email: string;
  onSubscriptionComplete: () => void;
  onClose: () => void;
  clientSecret: string;
  finalPrice: number;
  discountApplied: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      console.log('Confirming setup with stripe...');
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/create?subscription_success=true`,
        },
        redirect: 'if_required'
      });
      
      console.log('Setup confirmation result:', { error: error?.message, setupIntentStatus: setupIntent?.status });

      if (error) {
        console.error('Setup failed:', error);
        setErrorMessage(error.message || 'Setup failed');
        trackEvent('Purchase', 'subscription_setup_failed', error.type || 'unknown_error');
        
        toast({
          title: 'Payment Setup Failed',
          description: error.message || 'There was an issue setting up your payment method. Please try again.',
          variant: 'destructive'
        });
      } else if (setupIntent && setupIntent.status === 'succeeded') {
        // Payment method collected, now create the subscription
        console.log('Payment method setup successful, creating subscription...');
        
        const confirmResponse = await apiRequest('POST', '/api/confirm-subscription', {
          setupIntentId: setupIntent.id,
          paymentMethodId: setupIntent.payment_method
        });

        if (confirmResponse.ok) {
          console.log('Subscription created successfully!');
          trackEvent('Purchase', 'subscription_payment_succeeded', 'Artistic Collective Membership', subscriptionPlan.price);
          
          toast({
            title: 'Welcome to the Artistic Collective!',
            description: 'Your subscription is now active. You have unlimited poster generations.',
            variant: 'default'
          });
          
          onSubscriptionComplete();
          onClose();
        } else {
          const errorData = await confirmResponse.json();
          throw new Error(errorData.message || 'Failed to create subscription');
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      
      toast({
        title: 'Payment Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {errorMessage && (
        <div className="bg-red-900/30 border border-red-800 rounded-md px-4 py-3 text-red-200">
          {errorMessage}
        </div>
      )}
      
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 bg-gray-700 text-white rounded font-racing-sans hover:bg-gray-600 transition-colors duration-200 py-3 px-4"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className={`flex-1 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 py-3 px-4 flex items-center justify-center ${
            isProcessing ? 'opacity-70 cursor-not-allowed' : ''
          }`}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
              Processing...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Subscribe CHF {finalPrice.toFixed(2)}/month{discountApplied ? ' (Beta Price!)' : ''}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

export default function SubscriptionModal({
  isOpen,
  onClose,
  email,
  onSubscriptionComplete
}: SubscriptionModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const { toast } = useToast();

  // Reset modal state when it opens
  useEffect(() => {
    if (isOpen) {
      setClientSecret(null); // Reset payment state
      setIsLoading(false);
      setError(null);
      setPromoCode('');
      setDiscountApplied(false);
      setDiscountAmount(0);
    }
  }, [isOpen]);

  // Check promo code validity
  const checkPromoCode = (code: string) => {
    const validCodes = ['BETA60', 'EARLY60', 'LAUNCH60'];
    if (validCodes.includes(code.toUpperCase())) {
      setDiscountApplied(true);
      setDiscountAmount(0.6); // 60% discount
      return true;
    }
    setDiscountApplied(false);
    setDiscountAmount(0);
    return false;
  };

  // Handle promo code input
  const handlePromoCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    setPromoCode(code);
    checkPromoCode(code);
  };

  // Calculate final price
  const originalPrice = subscriptionPlan.price;
  const discountValue = originalPrice * discountAmount; // Percentage-based discount
  const finalPrice = originalPrice - discountValue;

  // If modal is not open, don't render anything
  if (!isOpen) return null;

  const handleProceedToPayment = async () => {
    console.log('Subscribe Now button clicked for email:', email);
    setIsLoading(true);
    setError(null);

    try {
      console.log('Making API request to /api/create-subscription...');
      // Create subscription
      const response = await apiRequest('POST', '/api/create-subscription', {
        email,
        promoCode: discountApplied ? promoCode : undefined,
        discountAmount: discountApplied ? discountAmount : undefined
      });
      
      console.log('API response status:', response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create subscription');
      }

      const data = await response.json();
      console.log('Subscription response:', data);
      setClientSecret(data.clientSecret);
      
      trackEvent('Purchase', 'subscription_started', 'Artistic Collective Membership', subscriptionPlan.price);
    } catch (err) {
      console.error('Error creating subscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to create subscription';
      setError(errorMessage);
      
      toast({
        title: 'Subscription Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center overflow-y-auto pointer-events-auto">
      <div className="bg-black border border-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 text-white my-4 max-h-[90vh] overflow-y-auto pointer-events-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-racing-sans text-[#f1b917] whitespace-nowrap">
            {clientSecret ? 'Complete Subscription' : 'Join the Movement'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-800 rounded-md px-4 py-3 mb-4 text-red-200">
            {error}
          </div>
        )}

        {!clientSecret ? (
          <>


            <div className="border border-[#f1b917] bg-[#f1b917]/10 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-medium text-white mb-2">{subscriptionPlan.name}</h3>

                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Unlimited creations</li>
                    <li>• All artistic styles included</li>
                    <li>• Publish to catalogue</li>
                    <li>• Invites to popup events</li>

                    <li>• Priority customer support</li>
                    <li>• Cancel anytime</li>
                  </ul>
                </div>
                <div className="text-right">
                  {discountApplied ? (
                    <>
                      <div className="text-lg text-gray-400 line-through">CHF {originalPrice.toFixed(2)}</div>
                      <div className="text-2xl font-bold text-[#f1b917] whitespace-nowrap">CHF {finalPrice.toFixed(2)}</div>
                      <div className="text-xs text-[#f1b917] font-medium">60% OFF BETA!</div>
                      <div className="text-sm text-gray-400">per month</div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-white whitespace-nowrap">CHF {subscriptionPlan.price.toFixed(2)}</div>
                      <div className="text-sm text-gray-400">per month</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Promo Code Section */}
            <div className="mb-6">
              <label htmlFor="promoCode" className="block text-sm font-medium text-gray-300 mb-2">
                Promo Code (Optional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="promoCode"
                  value={promoCode}
                  onChange={handlePromoCodeChange}
                  placeholder="Optional promo code"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f1b917] focus:border-transparent"
                />
                {discountApplied && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
              {discountApplied && (
                <p className="text-sm text-green-400 mt-1">
                  🎉 Beta discount applied! Save CHF {discountValue.toFixed(2)} on your first month
                </p>
              )}
            </div>

            <button
              onClick={handleProceedToPayment}
              disabled={isLoading}
              className={`w-full bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 py-3 px-4 flex items-center justify-center ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-black border-t-transparent rounded-full"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Subscribe Now
                </>
              )}
            </button>
          </>
        ) : (
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              // Disable Link in the Elements context
              appearance: {
                rules: {
                  '.Link': {
                    display: 'none'
                  }
                }
              } 
            }}>
            <CheckoutForm
              email={email}
              onSubscriptionComplete={onSubscriptionComplete}
              onClose={onClose}
              clientSecret={clientSecret}
              finalPrice={finalPrice}
              discountApplied={discountApplied}
            />
          </Elements>
        )}
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          Secure payments processed by Stripe. Your data is protected with industry-standard encryption.
        </p>
      </div>
    </div>
  );
}