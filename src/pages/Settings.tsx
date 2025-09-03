import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import StatusRow from "@/components/ui/status-row";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { ExternalLink, DollarSign, CheckCircle, AlertCircle, Loader2, CreditCard, X, User } from "lucide-react";
import { useLocation } from "wouter";

interface StripeConnectStatus {
  hasAccount: boolean;
  accountId?: string;
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
  chargesEnabled?: boolean;
}

interface SubscriptionInfo {
  isActive: boolean;
  currentPeriodEnd?: string;
  willCancelAtPeriodEnd?: boolean;
  status?: string;
}

export default function Settings() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);

  // Redirect unauthenticated users to create page
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation('/create');
    }
  }, [isAuthenticated, authLoading, setLocation]);

  // Check for URL parameters from Stripe redirects
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Setup Complete!",
        description: "Your payment account has been successfully set up.",
        duration: 5000,
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (urlParams.get('refresh') === 'true') {
      toast({
        title: "Setup Required",
        description: "Please complete your payment account setup to receive payouts.",
        variant: "destructive",
        duration: 5000,
      });
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  // Fetch Stripe Connect status
  const fetchStripeStatus = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await apiRequest("GET", "/api/stripe-connect/connect-status");

      if (response.ok) {
        const data = await response.json();
        setStripeStatus(data);
      } else {
        console.error("Failed to fetch Stripe status");
      }
    } catch (error) {
      console.error("Error fetching Stripe status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch subscription information
  const fetchSubscriptionInfo = async () => {
    if (!isAuthenticated || !user || user.userType !== 'artistic_collective') return;

    try {
      const response = await apiRequest("GET", "/api/subscription-info");
      
      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo(data);
      } else {
        console.error("Failed to fetch subscription info");
      }
    } catch (error) {
      console.error("Error fetching subscription info:", error);
    }
  };

  // Cancel subscription
  const handleCancelSubscription = async () => {
    if (!isAuthenticated || !user) return;

    setIsCancellingSubscription(true);
    try {
      const response = await apiRequest("POST", "/api/cancel-subscription");
      
      if (response.ok) {
        // Refresh subscription info without startTransition
        fetchSubscriptionInfo();
        toast({
          title: "Subscription Cancelled",
          description: "Your subscription has been cancelled. You can no longer generate new posters, but you can still publish or unpublish your existing creations.",
          duration: 6000,
        });
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to cancel subscription",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast({
        title: "Error",
        description: "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  useEffect(() => {
    fetchStripeStatus();
    fetchSubscriptionInfo();
  }, [isAuthenticated]);

  // Create Stripe Connect account
  const handleCreateAccount = async () => {
    if (!isAuthenticated) return;

    setIsConnecting(true);
    try {
      const response = await apiRequest("POST", "/api/stripe-connect/create-connect-account");

      if (response.ok) {
        const data = await response.json();
        // Open Stripe onboarding in new tab
        window.open(data.onboardingUrl, '_blank');
        
        // Keep loading for a moment to show the action completed
        setTimeout(() => {
          setIsConnecting(false);
          toast({
            title: "Setup Started",
            description: "Complete your payment setup in the new tab, then refresh this page.",
            duration: 8000,
          });
        }, 1000);
      } else {
        const errorData = await response.json();
        setIsConnecting(false);
        toast({
          title: "Error",
          description: errorData.error || "Failed to create payment account",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsConnecting(false);
      toast({
        title: "Error",
        description: "Failed to create payment account",
        variant: "destructive",
      });
    }
  };

  // Refresh onboarding if incomplete
  const handleRefreshOnboarding = async () => {
    if (!isAuthenticated) return;

    setIsConnecting(true);
    try {
      const response = await apiRequest("POST", "/api/stripe-connect/refresh-onboarding");

      if (response.ok) {
        const data = await response.json();
        // Open Stripe onboarding in new tab
        window.open(data.onboardingUrl, '_blank');
        
        // Keep loading for a moment to show the action completed
        setTimeout(() => {
          setIsConnecting(false);
          toast({
            title: "Setup Continued",
            description: "Complete your payment setup in the new tab, then refresh this page.",
            duration: 8000,
          });
        }, 1000);
      } else {
        const errorData = await response.json();
        setIsConnecting(false);
        toast({
          title: "Error",
          description: errorData.error || "Failed to refresh onboarding",
          variant: "destructive",
        });
      }
    } catch (error) {
      setIsConnecting(false);
      toast({
        title: "Error",
        description: "Failed to refresh onboarding",
        variant: "destructive",
      });
    }
  };

  // Open Stripe Dashboard
  const handleOpenDashboard = async () => {
    if (!isAuthenticated) return;

    setIsDashboardLoading(true);
    try {
      const response = await apiRequest("POST", "/api/stripe-connect/dashboard-link");

      if (response.ok) {
        const data = await response.json();
        // Open dashboard in new tab
        window.open(data.url, '_blank');
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Failed to open dashboard",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open dashboard",
        variant: "destructive",
      });
    } finally {
      setIsDashboardLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navigation />
        <main className="flex-grow container mx-auto px-4 pt-1 pb-6 relative">
          <div className="text-center text-white py-12">
            <p>Please log in to access settings.</p>
          </div>
        </main>
        <Footer showTopLine={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navigation />
      
      <main className="flex-grow container mx-auto px-4 pt-1 pb-6 relative">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-8">
          </div>

          <div className="space-y-6">
            {/* Account Information */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Account Information</CardTitle>
                <CardDescription className="text-gray-400">
                  Your account details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-400">Email</label>
                  <p className="text-white">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Username</label>
                  <p className="text-white">@{user.username}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Account Type</label>
                  <p className="text-white capitalize">
                    {user.userType === 'artistic_collective' ? 'Artistic Collective' : 'Standard User'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Management - Show for Artistic Collective members */}
            {user.userType === 'artistic_collective' && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard size={20} />
                    Subscription Management
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your Artistic Collective membership
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscriptionInfo ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <StatusRow icon={subscriptionInfo.isActive ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}>
                          Status: {subscriptionInfo.isActive ? 'Active' : 'Inactive'}
                        </StatusRow>
                        
                        {subscriptionInfo.currentPeriodEnd && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-300">
                              {subscriptionInfo.willCancelAtPeriodEnd 
                                ? `Cancels on: ${new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString()}`
                                : `Next billing: ${new Date(subscriptionInfo.currentPeriodEnd).toLocaleDateString()}`
                              }
                            </span>
                          </div>
                        )}
                      </div>

                      {subscriptionInfo.isActive && !subscriptionInfo.willCancelAtPeriodEnd && (
                        <Button
                          onClick={handleCancelSubscription}
                          disabled={isCancellingSubscription}
                          variant="outline"
                          className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        >
                          {isCancellingSubscription ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 mr-2" />
                              Cancel Subscription
                            </>
                          )}
                        </Button>
                      )}

                      {subscriptionInfo.willCancelAtPeriodEnd && (
                        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                          <p className="text-yellow-400 text-sm">
                            Your subscription is set to cancel at the end of your current billing period. 
                            You'll retain access to unlimited generations until then.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-400">Loading subscription information...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Settings - Show only for Artistic Collective members */}
            {user.userType === 'artistic_collective' && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign size={20} />
                    Payment Settings
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Set up payments to receive earnings from poster sales
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                  ) : stripeStatus ? (
                    <div className="space-y-4">
                      {/* Status Display */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {stripeStatus.hasAccount ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm text-gray-300">
                            Payment Account: {stripeStatus.hasAccount ? 'Created' : 'Not Set Up'}
                          </span>
                        </div>
                        
                        {stripeStatus.hasAccount && (
                          <>
                            <StatusRow icon={stripeStatus.onboardingComplete ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            )}>
                              Setup: {stripeStatus.onboardingComplete ? 'Complete' : 'Incomplete'}
                            </StatusRow>
                            
                            <StatusRow icon={stripeStatus.payoutsEnabled ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            )}>
                              Payouts: {stripeStatus.payoutsEnabled ? 'Enabled' : 'Disabled'}
                            </StatusRow>
                          </>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {!stripeStatus.hasAccount ? (
                          <Button
                            onClick={handleCreateAccount}
                            disabled={isConnecting}
                            className="w-full bg-[#f1b917] text-black hover:bg-[#d49f14] font-racing-sans"
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Setting up...
                              </>
                            ) : (
                              'Set Up Payment Account'
                            )}
                          </Button>
                        ) : !stripeStatus.onboardingComplete ? (
                          <Button
                            onClick={handleRefreshOnboarding}
                            disabled={isConnecting}
                            variant="outline"
                            className="w-full border-[#f1b917] text-[#f1b917] hover:bg-[#f1b917] hover:text-black font-racing-sans"
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading...
                              </>
                            ) : (
                              'Complete Setup'
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={handleOpenDashboard}
                            disabled={isDashboardLoading}
                            className="w-full bg-[#f1b917] text-black hover:bg-[#d49f14] font-racing-sans"
                          >
                            {isDashboardLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Opening...
                              </>
                            ) : (
                              <>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open Payment Dashboard
                              </>
                            )}
                          </Button>
                        )}
                        
                        {stripeStatus.hasAccount && stripeStatus.onboardingComplete && (
                          <p className="text-xs text-gray-500 text-center">
                            View your earnings, payouts, and payment history
                          </p>
                        )}
                      </div>

                      {!stripeStatus.payoutsEnabled && stripeStatus.hasAccount && (
                        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                          <p className="text-yellow-400 text-sm">
                            Complete your account setup to enable payouts and start earning from poster sales.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-400">Failed to load payment settings</p>
                      <Button
                        onClick={fetchStripeStatus}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>


        </div>
      </main>
      
      <Footer showTopLine={true} />
    </div>
  );
}