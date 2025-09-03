/**
 * Utility functions for sharing poster images with white borders
 */

/**
 * Share poster thumbnail with catalogue-style white border (24px)
 * @param imageUrl URL of the image to share (will use thumbnail)
 * @param shareText Custom text for sharing
 */
export async function sharePosterImage(imageUrl: string, shareText: string = "Check out this poster I created on coffeeandprints.com"): Promise<void> {
  try {
    // Get image with border from server
    const response = await fetch('/api/share-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageUrl }),
    });

    if (!response.ok) {
      throw new Error('Failed to create share image');
    }

    const blob = await response.blob();
    
    // Check if Web Share API is supported
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], 'poster-share.png', { type: 'image/png' });
      const shareData = {
        title: 'Coffee&Prints',
        text: shareText,
        files: [file]
      };
      
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
      
      // Try without files if file sharing not supported
      const textOnlyData = {
        title: 'Coffee&Prints',
        text: shareText
      };
      
      if (navigator.canShare(textOnlyData)) {
        await navigator.share(textOnlyData);
        await fallbackShare(blob, shareText);
        return;
      }
    }
    
    // Fallback: Download image and copy text to clipboard
    await fallbackShare(blob, shareText);
    
  } catch (error) {
    console.error('Error sharing image:', error);
    throw error;
  }
}

/**
 * Fallback share method: download image and copy text to clipboard
 */
async function fallbackShare(blob: Blob, shareText: string): Promise<void> {
  try {
    // Copy text to clipboard
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareText);
    }
    
    // Download image
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'poster-share.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Fallback share failed:', error);
    throw error;
  }
}