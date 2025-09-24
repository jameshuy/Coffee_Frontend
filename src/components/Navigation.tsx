import { Link, useLocation } from "wouter";
import { User, LogOut, Brush, Settings, Store, Play } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiRequest } from '@/lib/queryClient';
import NavIcon from '@/components/ui/nav-icon';
import CreditsBadge from '@/components/ui/credits-badge';

interface NavigationProps {
  transparent?: boolean;
}

export default function Navigation({ transparent = false }: NavigationProps) {
  const [location] = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const {
    isCataloguePage,
    isDashboardPage,
    isSettingsPage,
    isEarnPage,
    isCreatePage,
    isFeedPage,
    isPartnersPage,
  } = useMemo(() => ({
    isCataloguePage: location === "/catalogue",
    isDashboardPage: location === "/dashboard",
    isSettingsPage: location === "/settings",
    isEarnPage: location === "/earn",
    isCreatePage: location === "/create",
    isFeedPage: location === "/feed",
    isPartnersPage: location === "/partners",
  }), [location]);
  
  // Use proper authentication state only
  const hasUserSession = isAuthenticated;
  
  // Credits state for Create page
  const [availableCredits, setAvailableCredits] = useState<number>(0);
  const [isArtisticCollective, setIsArtisticCollective] = useState<boolean>(false);
  
  // Fetch credits and user type when on Create/Feed and user has session
  const fetchCredits = useCallback(async () => {
    try {
      // Get user email from auth context only
      const userEmail = user?.email;
      
      if (userEmail) {
        const response = await apiRequest('GET', `/api/generation-credits?email=${encodeURIComponent(userEmail)}`);
        if (response.ok) {
          const data = await response.json();
          // Calculate total credits the same way as Create page
          const totalCredits = (data.freeCreditsRemaining || 0) + (data.paidCredits || 0);
          setAvailableCredits(totalCredits);
          setIsArtisticCollective(data.userType === 'artistic_collective');
        }
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  }, [user?.email]);

  // Centralized trigger with identical deferral semantics used in both effects
  const triggerFetchIfNeeded = useCallback(() => {
    if ((isCreatePage || isFeedPage) && hasUserSession) {
      return setTimeout(() => fetchCredits(), 0);
    }
    return null;
  }, [isCreatePage, isFeedPage, hasUserSession, fetchCredits]);

  useEffect(() => {
    let mounted = true;
    const timeoutId = triggerFetchIfNeeded();
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [triggerFetchIfNeeded]);

  // Listen for credit updates from Create page
  useEffect(() => {
    const handleCreditUpdate = () => {
      triggerFetchIfNeeded();
    };
    window.addEventListener('creditsUpdated', handleCreditUpdate);
    return () => window.removeEventListener('creditsUpdated', handleCreditUpdate);
  }, [triggerFetchIfNeeded]);
  
  return (
    <nav className={`${transparent ? 'bg-transparent' : 'bg-black'} shadow-sm pt-3 pb-2`}>
      <div className="container mx-auto px-4">
        <div className="w-full relative">
          {isCreatePage || isFeedPage ? (
            // Create and Feed pages: same layout as catalogue page
            <div className="flex flex-col justify-center items-center text-center">
              <div className="flex flex-wrap items-end justify-center">
                <Link href="/" className="inline-block">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl cursor-pointer tracking-normal leading-tight text-center font-racing-sans">
                    <span className="text-white">Coffee&</span><span className="text-[#f1b917]">Prints</span>
                  </h1>
                </Link>
                {isFeedPage && (
                  <span className="text-xl text-white font-racing-sans ml-2 mb-1.5 align-bottom">Moments</span>
                )}
                {isCreatePage && (
                  <span className="text-xl text-white font-racing-sans ml-2 mb-1.5 align-bottom">Create</span>
                )}
              </div>
              
              {hasUserSession && (
                <div className="w-full flex flex-col mt-4">
                  <div className="w-full flex items-center justify-between">
                    {/* Credits indicator on far left */}
                    <CreditsBadge 
                      isArtisticCollective={isArtisticCollective}
                      availableCredits={availableCredits}
                      onClick={() => {
                        if (isArtisticCollective) {
                          window.dispatchEvent(new CustomEvent('openSubscriptionModal'));
                        } else {
                          window.dispatchEvent(new CustomEvent('openCreditPurchaseModal'));
                        }
                      }}
                    />
                    
                    {/* Navigation icons */}
                    <div className="flex items-center gap-2">
                      <NavIcon href="/feed" active={isFeedPage}>
                        <Play size={24} />
                      </NavIcon>
                      
                      <NavIcon href="/create" active={isCreatePage}>
                        <Brush size={24} />
                      </NavIcon>
                      
                      <NavIcon href="/catalogue" active={isCataloguePage}>
                        <Store size={24} />
                      </NavIcon>
                      
                      <NavIcon href="/dashboard" active={isDashboardPage}>
                        <User size={24} />
                      </NavIcon>
                      
                      <NavIcon href="/settings" active={isSettingsPage}>
                        <Settings size={24} />
                      </NavIcon>
                      
                      <button
                        onClick={logout}
                        className="p-2 text-white hover:text-red-400 transition-colors cursor-pointer"
                      >
                        <LogOut size={24} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Horizontal line spanning from credits to logout */}
                  <div className="w-full h-px bg-white mt-3"></div>
                </div>
              )}
              
              {!hasUserSession && isFeedPage && (
                <div className="w-full flex flex-col mt-4">
                  <div className="w-full flex items-center justify-center">
                    {/* Navigation icons for unauthenticated users on feed page */}
                    <div className="flex items-center gap-2">
                      <Link href="/create">
                        <div className={`p-2 transition-colors cursor-pointer ${
                          isCreatePage ? 'text-[#f1b917]' : 'text-white hover:text-[#f1b917]'
                        }`}>
                          <Brush size={24} />
                        </div>
                      </Link>
                      
                      <Link href="/catalogue">
                        <div className={`p-2 transition-colors cursor-pointer ${
                          isCataloguePage ? 'text-[#f1b917]' : 'text-white hover:text-[#f1b917]'
                        }`}>
                          <Store size={24} />
                        </div>
                      </Link>
                      
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                        className={`p-2 transition-colors cursor-pointer text-white hover:text-[#f1b917]`}
                      >
                        <User size={24} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Horizontal line for unauthenticated users */}
                  <div className="w-full h-px bg-white mt-3"></div>
                </div>
              )}
            </div>
          ) : isDashboardPage || isSettingsPage ? (
            // Dashboard and Settings pages: show page-specific titles without animation
            <div className="flex flex-col">
              <div className="flex items-center justify-between sm:justify-between">
                <div className="flex-shrink-0 sm:block" style={{ maxWidth: "40%" }}>
                  <Link href="/" className="inline-block">
                    <h1 className="hidden sm:block text-3xl sm:text-4xl md:text-5xl lg:text-6xl cursor-pointer tracking-normal leading-tight font-racing-sans whitespace-nowrap text-white">
                      {isDashboardPage ? 'Dashboard' : 'Settings'}
                    </h1>
                  </Link>
                </div>
                
                {hasUserSession && (
                  <div className="flex items-center gap-3 sm:gap-2 flex-shrink-0 w-full sm:w-auto justify-center sm:justify-end">
                    <NavIcon href="/feed" active={isFeedPage}>
                      <Play size={24} />
                    </NavIcon>
                    
                    <NavIcon href="/create" active={isCreatePage}>
                      <Brush size={24} />
                    </NavIcon>
                    
                    <NavIcon href="/catalogue" active={isCataloguePage}>
                      <Store size={24} />
                    </NavIcon>
                    
                    <NavIcon href="/dashboard" active={isDashboardPage}>
                      <User size={24} />
                    </NavIcon>
                    
                    {/* <NavIcon href="/settings" active={isSettingsPage}>
                      <Settings size={24} />
                    </NavIcon> */}
                    
                    <button
                      onClick={logout}
                      className="p-2 text-white hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <LogOut size={24} />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Horizontal line spanning from Dashboard/Settings title to logout button */}
              {hasUserSession && (
                <div className="w-full h-px bg-white mt-3"></div>
              )}
            </div>
          ) : (
            // Other pages: centered layout
            <div className="flex flex-col justify-center items-center text-center">
              <div className="flex flex-wrap items-end justify-center">
                <Link href="/" className="inline-block">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl cursor-pointer tracking-normal leading-tight text-center font-racing-sans">
                    <span className="text-white">Coffee&</span><span className="text-[#f1b917]">Prints</span>
                  </h1>
                </Link>
                {isCataloguePage && (
                  <span className="text-xl text-white font-racing-sans ml-2 mb-1.5 align-bottom">Catalogue</span>
                )}
                {isFeedPage && (
                  <span className="text-xl text-white font-racing-sans ml-2 mb-1.5 align-bottom">Moments</span>
                )}
                {isCreatePage && (
                  <span className="text-xl text-white font-racing-sans ml-2 mb-1.5 align-bottom">Create</span>
                )}
                {/* {isPartnersPage && (
                  <span className="text-xl text-white font-racing-sans ml-2 mb-1.5 align-bottom">Partners</span>
                )} */}
              </div>
            </div>
          )}
          

          
          {!isCataloguePage && !isDashboardPage && !isSettingsPage && !isCreatePage && !isEarnPage && (
            <div className="flex flex-col items-center justify-center mt-2 mb-1">
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}