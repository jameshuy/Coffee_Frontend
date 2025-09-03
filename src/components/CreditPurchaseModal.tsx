import React, { useState, useEffect } from 'react';
import { X, Check, CreditCard } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { trackEvent } from '@/lib/analytics';
import { useToast } from '@/hooks/use-toast';

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
  name: 'Artistic Collective Membership',
  price: 9.99,
  description: 'Unlimited creations'
};

function CheckoutForm({ email, onSubscriptionComplete, onClose, clientSecret }: {
  email: string;
  onSubscriptionComplete: () => void;
  onClose: () => void;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Execute the payment
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
          payment_method_data: {
            billing_details: {
              email
            }
          }
        },
        redirect: 'if_required'
      });

      if (submitError) {
        console.error('Stripe payment error:', submitError);
        setErrorMessage(submitError.message || 'Payment failed');
        return;
      }

      // If we get here, payment succeeded but didn't redirect
      const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Track the successful subscription
        trackEvent('Purchase', 'subscription_completed', 'Artistic Collective Membership', subscriptionPlan.price);

        toast({
          title: 'Subscription Activated',
          description: 'Welcome to the Artistic Collective! You now have access to all features.',
          variant: 'default',
          duration: 4000,
        });

        // Close the modal and notify completion
        onSubscriptionComplete();
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'An error occurred during payment processing'
      );

      trackEvent('Error', 'subscription_error', 'Subscription Error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement 
        options={{
          layout: 'tabs'
        }}
      />
      
      {errorMessage && (
        <div className="bg-red-900/30 border border-red-800 rounded-md px-4 py-3 text-red-200">
          {errorMessage}
        </div>
      )}
      
      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full bg-[#f1b917] hover:bg-[#f1b917]/90 text-black font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : `Subscribe - CHF ${subscriptionPlan.price.toFixed(2)}/month`}
      </button>
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
  const [discountApplied, setDiscountApplied] = useState(false);
  const [finalPrice, setFinalPrice] = useState(subscriptionPlan.price);

  useEffect(() => {
    if (isOpen && !clientSecret) {
      createSubscription();
    }
  }, [isOpen]);

  const createSubscription = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/create-subscription', {
        email,
        plan: subscriptionPlan.id
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create subscription');
      }

      const data = await response.json();
      setClientSecret(data.clientSecret);
      
      // Check if discount was applied
      if (data.discountApplied) {
        setDiscountApplied(true);
        setFinalPrice(data.finalPrice || subscriptionPlan.price);
      }

      // Track subscription creation
      trackEvent('Subscription', 'subscription_created', email);
    } catch (error) {
      console.error('Error creating subscription:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize payment');
      trackEvent('Error', 'subscription_creation_error', email);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const appearance = {
    theme: 'night' as const,
    variables: {
      colorPrimary: '#f1b917',
      colorBackground: '#000000',
      colorText: '#ffffff',
      colorDanger: '#df1b41',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
    },
  };

  const options = {
    clientSecret: clientSecret || undefined,
    appearance,
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center overflow-y-auto">
      <div className="bg-black border border-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 text-white my-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-racing-sans text-[#f1b917] whitespace-nowrap">
            {clientSecret ? 'Complete Subscription' : 'Artistic Collective Membership'}
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
            {discountApplied && (
              <div className="bg-green-900/30 border border-green-800 rounded-md px-4 py-3 mb-4 text-green-200">
                <div className="flex items-center gap-2">
                  <Check size={16} />
                  <span className="font-medium">Beta Discount Applied! (60% off)</span>
                </div>
                <div className="text-sm mt-1">
                  First month: CHF {finalPrice.toFixed(2)} (was CHF {subscriptionPlan.price.toFixed(2)})
                </div>
              </div>
            )}

            <div className="border border-[#f1b917] bg-[#f1b917]/10 rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-medium text-white mb-2">{subscriptionPlan.name}</h3>

                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Unlimited creations</li>
                    <li>• All artistic styles included</li>
                    <li>• Sell limited & standard edition posters</li>
                    <li>• Featured in partnered locations</li>
                    <li>• Priority customer support</li>
                    <li>• Cancel anytime</li>
                  </ul>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white whitespace-nowrap">CHF {subscriptionPlan.price.toFixed(2)}</div>
                  <div className="text-sm text-gray-400">per month</div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f1b917]"></div>
                <span className="ml-3 text-gray-400">Setting up payment...</span>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <CreditCard className="mx-auto mb-2" size={24} />
                <p>Preparing your subscription...</p>
              </div>
            )}
          </>
        ) : (
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm
              email={email}
              onSubscriptionComplete={onSubscriptionComplete}
              onClose={onClose}
              clientSecret={clientSecret}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}