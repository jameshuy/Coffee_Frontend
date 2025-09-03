import ReactGA from "react-ga4";

// Flag to track if GA has been initialized already
let initialized = false;

/**
 * Initialize Google Analytics
 * Should be called once at app startup
 * @param measurementId - The GA4 Measurement ID (e.g., G-XXXXXXXXXX)
 * @param enableDebug - Whether to enable DebugView for testing (default: true in development)
 */
export const initAnalytics = (measurementId: string, enableDebug: boolean = process.env.NODE_ENV === 'development'): void => {
  if (!initialized && measurementId) {
    // Initialize with debug mode for development/testing
    ReactGA.initialize(measurementId, {
      testMode: enableDebug,
      // Send all events right away in debug mode
      gaOptions: {
        debug_mode: enableDebug
      }
    });
    
    // Enable DebugView with URL parameter for testing in all environments
    if (enableDebug || window.location.href.includes('?debug_mode=true')) {
      ReactGA.gtag('config', measurementId, {
        debug_mode: true
      });
      console.log("Google Analytics initialized with DEBUG MODE enabled for live testing");
    }
    
    initialized = true;
    console.log("Google Analytics initialized with ID:", measurementId);
  }
};

/**
 * Track a page view in GA
 * Should be called whenever a new page/view is loaded
 */
export const trackPageView = (path: string): void => {
  if (initialized) {
    ReactGA.send({ hitType: "pageview", page: path });
    console.log("Tracked page view:", path);
  }
};

/**
 * Track an event in GA
 * Use this for user interactions (clicks, form submissions, etc.)
 */
export const trackEvent = (
  category: string,
  action: string, 
  label?: string, 
  value?: number
): void => {
  if (initialized) {
    ReactGA.event({
      category,
      action,
      label,
      value
    });
    console.log(`Tracked event: ${category} - ${action}${label ? ' - ' + label : ''}`);
  }
};

/**
 * Track user engagement timing
 * Use for measuring performance or user engagement duration
 */
export const trackTiming = (
  category: string,
  variable: string,
  value: number,
  label?: string
): void => {
  if (initialized) {
    // Using gtag for timing since ReactGA.timing is not available in GA4
    ReactGA.gtag('event', 'timing_complete', {
      name: variable,
      value,
      event_category: category,
      event_label: label
    });
  }
};

/**
 * Track e-commerce transaction (completed order)
 */
export const trackTransaction = (
  id: string, 
  revenue: number,
  shipping: number = 0,
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    category?: string;
  }> = []
): void => {
  if (initialized) {
    // First track the transaction
    ReactGA.gtag('event', 'purchase', {
      transaction_id: id,
      value: revenue,
      shipping,
      currency: 'CHF',
      items: items.map(item => ({
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
        item_category: item.category || 'Poster'
      }))
    });
    
    console.log(`Tracked transaction: ${id} - CHF ${revenue}`);
  }
};

/**
 * Track style selected by user
 */
export const trackStyleSelection = (styleId: string, styleName: string): void => {
  trackEvent('Style', 'select', styleName);
};

/**
 * Track image upload attempt
 */
export const trackImageUpload = (success: boolean, errorMessage?: string): void => {
  if (success) {
    trackEvent('Image', 'upload', 'success');
  } else {
    trackEvent('Image', 'upload', `error: ${errorMessage || 'unknown'}`);
  }
};

/**
 * Track poster generation
 */
export const trackPosterGeneration = (
  styleId: string, 
  styleName: string, 
  success: boolean, 
  processingTimeMs?: number
): void => {
  if (success) {
    trackEvent('Poster', 'generate', `${styleName} (${styleId})`, processingTimeMs);
  } else {
    trackEvent('Poster', 'generation_failed', styleId);
  }
};

/**
 * Track checkout steps
 */
export const trackCheckoutStep = (step: number, option?: string): void => {
  if (initialized) {
    ReactGA.gtag('event', 'begin_checkout', {
      checkout_step: step,
      checkout_option: option
    });
  }
};



/**
 * Track specific errors
 */
export const trackError = (errorCategory: string, errorMessage: string): void => {
  trackEvent('Error', errorCategory, errorMessage);
};