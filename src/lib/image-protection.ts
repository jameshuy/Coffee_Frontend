/**
 * Image Protection Utilities
 * This file contains functions to prevent users from easily saving images
 */

/**
 * Prevents right-clicks and other common image saving methods on the specified elements
 * @param selector CSS selector for elements to protect (e.g., '.protected-image' or 'img.protected')
 */
export function preventImageDownload(selector: string = '.ImageUploader img') {
  // Simple function to apply the basic image protection - only to generated images
  const applyProtection = () => {
    // For desktops - right click prevention
    document.addEventListener('contextmenu', function(e) {
      const target = e.target as HTMLElement;
      if (target.matches(selector)) {
        e.preventDefault();
      }
    });

    // For mobile - DO NOT prevent touchstart events globally, as they interfere with scrolling
    // Only prevent long-press default actions, which would trigger the context menu
    document.addEventListener('contextmenu', function(e) {
      const target = e.target as HTMLElement;
      if (target.matches(selector)) {
        e.preventDefault();
      }
    });

    // For all - prevent drag and drop
    document.addEventListener('dragstart', function(e) {
      const target = e.target as HTMLElement;
      if (target.matches(selector)) {
        e.preventDefault();
      }
    });
  };

  // Apply protection when DOM is ready
  if (typeof window !== 'undefined') {
    if (document.readyState === 'complete') {
      applyProtection();
    } else {
      window.addEventListener('load', applyProtection);
    }
  }
  
  // Return a function that does nothing (for React useEffect cleanup)
  return () => {};
}

/**
 * Prevent copying, cutting, and screenshots
 * Note: This is limited by browser capabilities and won't work in all scenarios
 */
export function preventCopyingContent() {
  const preventCopy = (e: Event) => {
    e.preventDefault();
  };
  
  // Prevent copy/cut
  document.addEventListener('copy', preventCopy);
  document.addEventListener('cut', preventCopy);
  
  return () => {
    document.removeEventListener('copy', preventCopy);
    document.removeEventListener('cut', preventCopy);
  };
}