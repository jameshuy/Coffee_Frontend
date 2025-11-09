import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, Share2, Tag, Download, Coffee, Users, Calendar, Percent } from "lucide-react";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { apiRequest } from "@/lib/queryClient";

// Initialize Stripe with the publishable key (using the same env var as other components)
const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface UnlockModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    posterId: string;
    posterUrl: string;
    onUnlockSuccess: () => void;
}

interface CheckoutFormProps {
    posterId: string;
    onSuccess: () => void;
    onClose: () => void;
}

function CheckoutForm({ posterId, onSuccess, onClose }: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [isStripeReady, setIsStripeReady] = useState(false);

    useEffect(() => {
        // Check if Stripe is ready
        if (stripe && elements) {
            setIsStripeReady(true);
        }
    }, [stripe, elements]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            console.error("Stripe not loaded");
            toast({
                title: "Payment system not ready",
                description: "Please wait a moment and try again.",
                variant: "destructive",
            });
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            console.error("Card element not found");
            toast({
                title: "Card input not ready",
                description: "Please refresh the page and try again.",
                variant: "destructive",
            });
            return;
        }

        setIsProcessing(true);

        try {
            // Create payment intent for unlock
            const response = await apiRequest("POST", "/api/prepare-unlock-checkout", {
                posterId
            });

            const { clientSecret } = await response.json();

            // Confirm the payment
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                },
            });

            if (error) {
                console.error("Payment error:", error);
                toast({
                    title: "Payment failed",
                    description: error.message || "Something went wrong with the payment",
                    variant: "destructive",
                });
            } else if (paymentIntent && paymentIntent.status === "succeeded") {
                // Complete the unlock
                try {
                    const unlockResponse = await apiRequest("POST", "/api/complete-unlock", {
                        posterId,
                        paymentIntentId: paymentIntent.id,
                    });

                    const unlockData = await unlockResponse.json();

                    if (unlockData.success) {
                        toast({
                            title: "Success!",
                            description: "Your poster has been unlocked. All features are now available!",
                        });

                        onSuccess();
                        onClose();
                    } else {
                        throw new Error(unlockData.message || "Failed to complete unlock");
                    }
                } catch (unlockError) {
                    console.error("Error completing unlock after payment:", unlockError);
                    // Payment succeeded but unlock record failed - still update UI
                    // since the payment went through
                    toast({
                        title: "Payment successful!",
                        description: "Your poster has been unlocked. If you experience any issues, please contact support.",
                    });

                    onSuccess();
                    onClose();
                }
            }
        } catch (error) {
            console.error("Checkout error:", error);
            toast({
                title: "Error",
                description: "Failed to process payment. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 bg-gray-900 rounded-lg">
                <CardElement
                    options={{
                        style: {
                            base: {
                                fontSize: "16px",
                                color: "#ffffff",
                                "::placeholder": {
                                    color: "#6b7280",
                                },
                            },
                            invalid: {
                                color: "#ef4444",
                            },
                        },
                    }}
                />
            </div>

            <div className="flex justify-between items-center pt-4">
                <Button
                    type="button"
                    onClick={onClose}
                    variant="outline"
                    className="border-gray-700 text-white hover:bg-gray-800"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isProcessing || !isStripeReady}
                    className="bg-white text-black hover:bg-gray-100 font-bold px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : !isStripeReady ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading...
                        </>
                    ) : (
                        "Unlock for €3"
                    )}
                </Button>
            </div>
        </form>
    );
}

export function UnlockModal({ open, onOpenChange, posterId, posterUrl, onUnlockSuccess }: UnlockModalProps) {
    const handleClose = () => {
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="top-[50%] translate-y-[-50%] sm:max-w-[450px] bg-black border-[#f1b917] text-white">
                <DialogHeader>
                    <DialogTitle className="text-center font-racing text-2xl text-[#f1b917] mb-1" style={{ fontFamily: "'Racing Sans One', cursive" }}>
                        Unlock Your Poster's Potential
                    </DialogTitle>
                    <DialogDescription className="text-center text-gray-300 text-sm">
                        One-time €3 investment • Unlimited earning potential
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-3">
                    {/* What you unlock */}
                    <div className="mb-3 p-3 bg-gray-900/50 rounded-lg">
                        <ul className="space-y-3">
                            <li className="flex items-start">
                                <Download className="mr-2 h-4 w-4 text-[#f1b917] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-white font-semibold text-sm">Instant HD Download</p>
                                    <p className="text-gray-400 text-xs">A3 print-ready file • Professional quality • Yours forever</p>
                                </div>
                            </li>
                            <li className="flex items-start relative pt-3">
                                <div className="absolute -top-0 left-0 bg-gradient-to-r from-[#f1b917] to-[#ffd700] text-black text-[9px] font-bold px-1.5 py-0.5 rounded">
                                    💰 10X VALUE
                                </div>
                                <Tag className="mr-2 h-4 w-4 text-[#f1b917] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-white font-semibold text-sm">Turn €3 into €30+</p>
                                    <p className="text-gray-400 text-xs">Set your price • Get featured • Earn from every collector purchase</p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <Share2 className="mr-2 h-4 w-4 text-[#f1b917] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-white font-semibold text-sm">Go Viral Ready</p>
                                    <p className="text-gray-400 text-xs">Share your poster clip • Build your following • Grow your brand</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {stripePromise ? (
                        <Elements stripe={stripePromise}>
                            <CheckoutForm
                                posterId={posterId}
                                onSuccess={onUnlockSuccess}
                                onClose={handleClose}
                            />
                        </Elements>
                    ) : (
                        <div className="text-center p-4">
                            <p className="text-red-500 mb-2">Payment system not configured</p>
                            <p className="text-gray-400 text-sm">Please contact support to complete your purchase.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}