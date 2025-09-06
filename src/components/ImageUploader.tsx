import { useCallback, useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { trackImageUpload, trackEvent } from '@/lib/analytics';
import { preventImageDownload } from '@/lib/image-protection';
import TextOverlayTool from './TextOverlayTool';

interface TextOverlay {
  text: string;
  position: { x: number; y: number };
}

interface ImageUploaderProps {
  onImageUpload: (imageDataUrl: string) => void;
  onVideoUpload?: (videoFile: File) => void;
  uploadedImage: string | null;
  uploadedVideo?: File | null;
  videoFrameData?: { frameDataUrl: string; timestamp: number } | null;
  isGenerated?: boolean; // Add this to know when to animate
  isGenerating?: boolean; // Add this to show loading state
  isUploadingVideo?: boolean; // Add this to show video upload state
  onTextAdd?: (textOverlay: TextOverlay) => void;
  showTextTool?: boolean;
  onTextToolClose?: () => void;
  textOverlay?: TextOverlay | null;
  onImageError?: () => void; // Add callback for image errors
}

// Keep image file size limit, no limit for videos, enforce 10-second duration limit
const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10MB for images
const MAX_VIDEO_DURATION = 10; // seconds

export default function ImageUploader({ 
  onImageUpload, 
  onVideoUpload,
  uploadedImage, 
  uploadedVideo,
  videoFrameData = null,
  isGenerated = false, 
  isGenerating = false,
  isUploadingVideo = false,
  onTextAdd,
  showTextTool = false,
  onTextToolClose,
  textOverlay = null,
  onImageError
}: ImageUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);
  const [generatedImageLoaded, setGeneratedImageLoaded] = useState(false);
  const [showVideoTransition, setShowVideoTransition] = useState(false);
  const [videoObjectUrl, setVideoObjectUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const posterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMobile = useIsMobile();
  
  // Calculate and update container height based on viewport
  useEffect(() => {
    const calculateHeight = () => {
      // If we have a generated image that's fully loaded, use the larger height calculation (80% of viewport)
      if (isGenerated) {
        // A3 aspect ratio is 1:1.414 (portrait)
        const maxViewportHeight = window.innerHeight * 0.8; // Use 80% of viewport height
        const maxWidth = isMobile ? window.innerWidth * 0.95 : window.innerWidth * 0.65; // Use less width on mobile
        
        // Calculate height based on A3 aspect ratio (width / 0.707)
        const heightBasedOnWidth = maxWidth / 0.707;
        
        // Use the smaller of the two to ensure it fits on screen
        const optimalHeight = Math.min(maxViewportHeight, heightBasedOnWidth);
        
        setContainerHeight(optimalHeight);
      } else {
        // For initial upload state, use the same size as the video box (350px max-width)
        // A3 aspect ratio applied to 350px width = 495px height
        setContainerHeight(495);
      }
    };
    
    // Calculate initially and on resize
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    
    return () => {
      window.removeEventListener('resize', calculateHeight);
      // Clean up any pending poster timeout
      if (posterTimeoutRef.current) {
        clearTimeout(posterTimeoutRef.current);
        posterTimeoutRef.current = null;
      }
    };
  }, [isMobile, isGenerated]);
  
  // Reset image loaded state when generation starts, but preserve state when showing a generated image
  useEffect(() => {
    if (isGenerating) {
      setGeneratedImageLoaded(false);
    }
  }, [isGenerating]);
  
  // Ensure generated state is properly applied when the component switches to isGenerated=true
  // Also handle merged videos for video uploads
  useEffect(() => {
    if (isGenerated && !isGenerating && uploadedImage) {
      // Small delay before applying the animation effect
      const timer = setTimeout(() => {
        setGeneratedImageLoaded(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isGenerated, isGenerating, uploadedImage]);

  // Create video object URL for display and handle cleanup
  useEffect(() => {
    if (uploadedVideo) {
      const url = URL.createObjectURL(uploadedVideo);
      setVideoObjectUrl(url);
      setShowVideoTransition(true);
      
      return () => {
        URL.revokeObjectURL(url);
        setVideoObjectUrl(null);
      };
    } else {
      setShowVideoTransition(false);
      setVideoObjectUrl(null);
    }
  }, [uploadedVideo]);

  // Keep showing video transition even after generation completes
  // The video will loop and show the poster at the selected frame
  useEffect(() => {
    if (isGenerated && uploadedVideo && !isGenerating) {
      // Keep video transition active to show the frame-perfect loop
      setShowVideoTransition(true);
    }
  }, [isGenerated, uploadedVideo, isGenerating]);
  
  // Animation is now handled by the className and css transition properties

  // Auto-scroll function to position image at top of viewport
  const scrollToImageTop = useCallback(() => {
    if (containerRef.current) {
      // Wait a short moment for DOM to update
      setTimeout(() => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          // Align image box top with page top (no buffer)
          const scrollTarget = window.scrollY + rect.top;
          window.scrollTo({
            top: scrollTarget,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [containerRef]);

  // Video file handling function
  const handleVideoFile = useCallback(async (file: File) => {
    console.log("VIDEO FILE INFO:", {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    });

    setIsLoading(true);
    
    try {
      // Create video element to check duration
      const video = document.createElement('video');
      const videoUrl = URL.createObjectURL(file);
      
      video.src = videoUrl;
      video.preload = 'metadata';
      
      await new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          console.log("VIDEO METADATA:", {
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight
          });
          
          // Check duration limit
          if (video.duration > MAX_VIDEO_DURATION) {
            const durationSeconds = Math.round(video.duration);
            trackEvent('Video', 'upload_rejected_duration', `${durationSeconds}s`);
            toast({
              title: "Video Too Long",
              description: `Video must be ${MAX_VIDEO_DURATION} seconds or shorter. Your video is ${durationSeconds} seconds.`,
              variant: "destructive",
              duration: 5000
            });
            
            URL.revokeObjectURL(videoUrl);
            setIsLoading(false);
            
            if (onImageError) {
              onImageError();
            }
            reject(new Error('Video too long'));
            return;
          }
          
          resolve(null);
        };
        
        video.onerror = () => {
          trackEvent('Video', 'upload_error', 'metadata_load_failed');
          toast({
            title: "Video Error",
            description: "Unable to process this video file. Please try a different video.",
            variant: "destructive",
            duration: 5000
          });
          
          URL.revokeObjectURL(videoUrl);
          setIsLoading(false);
          
          if (onImageError) {
            onImageError();
          }
          reject(new Error('Video load failed'));
        };
      });
      
      // Video is valid, call the upload handler
      trackEvent('Video', 'upload_success', file.type);
      
      if (onVideoUpload) {
        onVideoUpload(file);
      }
      
      // Clean up
      URL.revokeObjectURL(videoUrl);
      setIsLoading(false);
      
    } catch (error) {
      console.error("Error processing video:", error);
      setIsLoading(false);
    }
  }, [onVideoUpload, onImageError]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejected files (larger than 8MB or wrong type)
    if (rejectedFiles && rejectedFiles.length > 0) {
      const rejectedFile = rejectedFiles[0];
      
      // Check rejection reasons and provide specific error messages
      if (rejectedFile.errors && rejectedFile.errors.length > 0) {
        const error = rejectedFile.errors[0];
        
        // File size error (only applies to images now)
        if (error.code === 'file-too-large') {
          const sizeMB = (rejectedFile.file.size / (1024 * 1024)).toFixed(1);
          trackImageUpload(false, `Image file size exceeded 10MB limit (${sizeMB}MB)`);
          toast({
            title: "Image Too Large",
            description: `Your image file is too large. Please resize your image to under 10MB, or try a different photo.`,
            variant: "destructive",
            duration: 5000
          });
          
          // Call the onImageError callback if provided
          if (onImageError) {
            onImageError();
          }
        } 
        // File type error
        else if (error.code === 'file-invalid-type') {
          trackImageUpload(false, `Invalid file type: ${rejectedFile.file.type || 'unknown'}`);
          toast({
            title: "Unsupported file format",
            description: `Please upload a JPG, PNG, or WebP image file. The file you selected (${rejectedFile.file.name}) is not supported.`,
            variant: "destructive",
            duration: 5000
          });
          
          // Call the onImageError callback if provided
          if (onImageError) {
            onImageError();
          }
        }
        // Generic error
        else {
          trackImageUpload(false, `Upload error: ${error.message}`);
          toast({
            title: "Upload failed",
            description: error.message || "There was a problem with your image. Please try again with a different image.",
            variant: "destructive",
            duration: 5000
          });
          
          // Call the onImageError callback if provided
          if (onImageError) {
            onImageError();
          }
        }
      }
      return;
    }
    
    if (acceptedFiles && acceptedFiles[0]) {
      const file = acceptedFiles[0];
      
      // Track that a file was dropped/selected
      trackEvent('Image', 'upload_attempt', file.type);
      
      // Check if it's a video or image file and handle accordingly
      if (file.type.startsWith('video/')) {
        // Handle video upload
        handleVideoFile(file);
        return;
      }
      
      // For images, check file size
      if (file.size > MAX_IMAGE_FILE_SIZE) {
        trackImageUpload(false, 'File size exceeded 10MB limit');
        toast({
          title: "Image file too large",
          description: "Maximum image file size is 10MB. Please upload a smaller image.",
          variant: "destructive"
        });
        return;
      }
      
      console.log("FILE INFO (Client):", {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        lastModified: new Date(file.lastModified).toISOString()
      });
      
      setIsLoading(true);
      const reader = new FileReader();
      
      reader.onload = (e) => {
        setIsLoading(false);
        if (e.target?.result) {
          const dataUrl = e.target.result as string;
          console.log("IMAGE LOADED (Client):", {
            dataUrlLength: dataUrl.length,
            dataUrlPrefix: dataUrl.substring(0, 50) + "...",
          });
          
          // Validate image data before proceeding
          if (!dataUrl.startsWith('data:image/')) {
            trackImageUpload(false, 'Invalid image data format');
            toast({
              title: "Image format error",
              description: "The file you selected doesn't appear to be a valid image. Please try a different file.",
              variant: "destructive",
              duration: 5000
            });
            return;
          }
          
          // Create a debugger image element to verify image loading and dimensions
          const img = new Image();
          
          img.onload = () => {
            console.log("CLIENT IMAGE DIMENSIONS:", {
              width: img.width,
              height: img.height,
              aspectRatio: (img.width / img.height).toFixed(2)
            });
            
            // Check if image dimensions are too small
            if (img.width < 300 || img.height < 300) {
              trackImageUpload(false, `Image too small: ${img.width}x${img.height}`);
              toast({
                title: "Image too small",
                description: "For best results, please use a larger image. We recommend at least 1000×1500 pixels.",
                variant: "destructive",
                duration: 5000
              });
              // Still proceed with the small image
            }
            
            // Track successful image upload
            trackImageUpload(true);
            
            // Process the image
            onImageUpload(dataUrl);
            
            // Trigger auto-scroll after image is loaded
            scrollToImageTop();
          };
          
          img.onerror = () => {
            trackImageUpload(false, 'Image loading error');
            toast({
              title: "Image loading failed",
              description: "We couldn't process this image. It may be corrupted or in an unsupported format. Please try another image.",
              variant: "destructive",
              duration: 5000
            });
          };
          
          img.src = dataUrl;
        } else {
          trackImageUpload(false, 'No image data in FileReader result');
          toast({
            title: "Upload failed",
            description: "No image data was found. Please try again with a different image.",
            variant: "destructive"
          });
        }
      };
      
      reader.onerror = (error) => {
        setIsLoading(false);
        console.error("File Reader Error:", error);
        
        // Track file read error with more details if available
        const errorMessage = error?.target?.error?.message || 'Unknown FileReader error';
        trackImageUpload(false, `FileReader error: ${errorMessage}`);
        
        toast({
          title: "Upload Error",
          description: "There was a problem processing your image. The file might be corrupted or too complex to process. Please try a different image.",
          variant: "destructive",
          duration: 5000
        });
      };
      
      // Add a timeout to handle cases where the FileReader gets stuck
      const timeoutId = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          trackImageUpload(false, 'FileReader timeout');
          
          toast({
            title: "Upload Timeout",
            description: "Your image is taking too long to process. It might be too large or complex. Please try a smaller or simpler image.",
            variant: "destructive",
            duration: 5000
          });
          
          // Abort the file read operation if possible
          try {
            reader.abort();
          } catch (error) {
            console.error("Error aborting FileReader:", error);
          }
        }
      }, 15000); // 15 second timeout
      
      // Clean up the timeout when the operation completes
      reader.onloadend = () => {
        clearTimeout(timeoutId);
      };
      
      // DO NOT MODIFY! Use readAsDataURL exactly as is
      reader.readAsDataURL(file);
    }
  }, [onImageUpload, scrollToImageTop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // Add file type validation for both images and videos
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.mov', '.webm', '.avi']
    },
    multiple: false
    // Remove maxSize limit for videos
  });

  return (
    <div className="ImageUploader w-full mx-auto flex justify-center items-center transition-all duration-500 ease-in-out" style={{ maxWidth: isGenerated ? 'none' : '350px' }}>
      {/* Dynamic sized container with A3 aspect ratio */}
      <div 
        ref={containerRef}
        className="relative mx-auto"
        style={{
          height: containerHeight || 550, // Fallback height 
          width: containerHeight ? containerHeight * 0.707 : 389, // A3 aspect ratio (height * 0.707)
          maxWidth: '95vw',
          transition: 'all 0.5s ease-in-out, box-shadow 1.2s ease-in-out',
          transform: isGenerated && generatedImageLoaded ? 'scale(1.1)' : 'scale(1)',
          boxShadow: isGenerated && generatedImageLoaded ? '0 0 30px rgba(255,215,0,0.7)' : 'none'
        }}
      >
        {/* Dropzone for uploading images */}
        <div 
          {...((!isGenerated && !isGenerating) ? getRootProps() : {})} 
          className={`absolute inset-0 border-0 ${isDragActive ? 'bg-gray-100' : 'bg-secondary'} rounded-lg ${(!isGenerated && !isGenerating) ? 'cursor-pointer hover:bg-gray-100' : ''} transition-all ${isGenerated ? 'bg-opacity-90' : ''}`}
        >
          {(!isGenerated && !isGenerating) && <input {...getInputProps()} />}
          
          {!uploadedImage ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
              <Button type="button" className="px-5 py-2 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-base">
                Tap to upload Photo or Clip
              </Button>
              <p className="mt-4 text-sm text-gray-600">Images: JPG, PNG (max 10MB)</p>
              <p className="mt-1 text-sm text-gray-600">Videos: MP4, MOV, WebM (max 10 seconds)</p>
            </div>
          ) : (
            <div className="absolute inset-0 transition-opacity duration-500">
              {/* Show merged video if available and original upload was video, otherwise show image */}
              <div 
                className="relative w-full h-full overflow-hidden rounded-lg"
                style={{
                  border: isGenerated ? '30px solid white' : 'none'
                }}>
                {/* Show video with poster transition at selected frame */}
                {showVideoTransition && videoObjectUrl && uploadedVideo ? (
                  <div className="relative w-full h-full">
                    {/* Base video that loops */}
                    <video 
                      ref={videoRef}
                      src={videoObjectUrl}
                      className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${
                        isGenerating ? 'opacity-60' : 'opacity-100'
                      }`}
                      autoPlay
                      muted
                      loop
                      playsInline
                      onLoadedData={() => {
                        console.log('Video transition loaded in DOM');
                      }}
                      onTimeUpdate={() => {
                        // Show poster overlay for exactly 3 seconds after selected frame
                        if (videoRef.current && videoFrameData && isGenerated && !isGenerating) {
                          const currentTime = videoRef.current.currentTime;
                          const targetTime = videoFrameData.timestamp;
                          const posterDisplayDuration = 3; // Always show poster for 3 seconds
                          
                          const posterOverlay = document.getElementById('poster-overlay');
                          if (posterOverlay) {
                            // Show poster from targetTime to targetTime + 3 seconds
                            const posterEndTime = targetTime + posterDisplayDuration;
                            
                            if (currentTime >= targetTime && currentTime < posterEndTime) {
                              // Show poster during the 3-second window
                              if (posterOverlay.style.opacity !== '1') {
                                console.log(`🎬 Poster fade-in at ${currentTime.toFixed(1)}s for 3 seconds`);
                                posterOverlay.style.opacity = '1';
                              }
                              
                              // Pause video at target time to show poster for 3 seconds
                              if (Math.abs(currentTime - targetTime) < 0.1 && !videoRef.current.paused) {
                                console.log(`🎬 Pausing video at ${currentTime.toFixed(1)}s for 3-second poster display`);
                                videoRef.current.pause();
                                setTimeout(() => {
                                  if (videoRef.current && !videoRef.current.ended) {
                                    console.log(`🎬 Resuming video after 3-second poster display`);
                                    videoRef.current.play();
                                  }
                                }, posterDisplayDuration * 1000);
                              }
                            } else {
                              // Hide poster outside the 3-second window
                              if (posterOverlay.style.opacity !== '0') {
                                console.log(`🎬 Hiding poster at ${currentTime.toFixed(1)}s`);
                                posterOverlay.style.opacity = '0';
                              }
                            }
                          }
                        }
                      }}
                    />
                    
                    {/* Poster overlay that appears at selected frame */}
                    {isGenerated && uploadedImage && (
                      <img
                        id="poster-overlay"
                        src={uploadedImage}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-0"
                        alt="Generated poster at selected frame"
                      />
                    )}
                  </div>
                ) : (
                  <img 
                    src={import.meta.env.VITE_API_URL + uploadedImage} 
                    className={`w-full h-full object-cover transition-all duration-1000 ease-in-out ${
                      isGenerating ? 'opacity-40' : 'opacity-100'
                    }`}
                    alt="Your artistic poster"
                    onLoad={() => {
                      console.log('Generated image fully loaded in background, applying effects');
                      setGeneratedImageLoaded(true);
                    }}
                  />
                )}
                
                {/* Loading overlay with centered spinner - show only during generation */}
                {isGenerating && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black bg-opacity-60 rounded-lg">
                    <div className="animate-spin h-20 w-20 border-4 border-[#f1b917] border-t-transparent rounded-full shadow-lg mb-4"></div>
                    <p className="text-white text-lg font-medium mt-2">Creating Your Masterpiece...</p>
                    <p className="text-white text-sm opacity-80 mt-1">Do not navigate away from the page</p>
                    <p className="text-white text-sm opacity-80 mt-1">1 - 2 minutes</p>
                  </div>
                )}
                
                {/* Video upload overlay with centered spinner - show only during video upload */}
                {isUploadingVideo && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black bg-opacity-60 rounded-lg">
                    <div className="animate-spin h-20 w-20 border-4 border-[#f1b917] border-t-transparent rounded-full shadow-lg mb-4"></div>
                    <p className="text-white text-lg font-medium mt-2">Uploading Video...</p>
                    <p className="text-white text-sm opacity-80 mt-1">This may take a moment on mobile connections</p>
                  </div>
                )}

                
                {/* Text overlay display */}
                {textOverlay && textOverlay.text && (
                  <div 
                    className={`absolute pointer-events-none z-30 ${showTextTool ? 'opacity-50' : 'opacity-100'}`}
                    style={{
                      left: `${textOverlay.position.x}px`,
                      top: `${textOverlay.position.y}px`
                    }}
                  >
                    <span 
                      className="text-white text-2xl font-bold whitespace-nowrap"
                      style={{ 
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                        display: 'inline-block'
                      }}
                    >
                      {textOverlay.text}
                    </span>
                  </div>
                )}
                
                {/* Text overlay tool */}
                {uploadedImage && showTextTool && onTextAdd && onTextToolClose && (
                  <TextOverlayTool
                    containerRef={containerRef}
                    onSave={(textOverlay) => {
                      if (onTextAdd) {
                        onTextAdd(textOverlay);
                      }
                    }}
                    onCancel={onTextToolClose}
                    initialText={textOverlay?.text || ''}
                    initialPosition={textOverlay?.position || { x: 0, y: 0 }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}