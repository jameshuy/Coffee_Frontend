import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { useIsMobile } from '@/hooks/use-mobile';
import ImageSourceModal from '@/components/ImageSourceModal';
import { toast } from '@/hooks/use-toast';
import { trackEvent, trackImageUpload } from '@/lib/analytics';

interface TextOverlay {
  text: string;
  position: { x: number; y: number };
}

interface ImageUploaderProps {
  onImageUpload: (imageDataUrl: string) => void;
  onVideoUpload?: (videoFile: File) => void;
  uploadedImage: string | null;
  onImageError?: () => void; // Add callback for image errors
}

const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_DURATION = 10; // seconds

export default function ImageUploader({
  onImageUpload,
  onVideoUpload,
  uploadedImage,
  onImageError
}: ImageUploaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  // Handle file selection directly for non-mobile devices
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    e.currentTarget.value = ""; // reset early
    if (!file) return;

    try {
      // Video flow
      if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        const url = URL.createObjectURL(file);
        video.src = url;
        video.preload = 'metadata';

        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => {
            if (video.duration > MAX_VIDEO_DURATION) {
              const durationSeconds = Math.round(video.duration);
              trackEvent('Video', 'upload_rejected_duration', `${durationSeconds}s`);
              toast({
                title: "Video Too Long",
                description: `Video must be ${MAX_VIDEO_DURATION} seconds or shorter. Your video is ${durationSeconds} seconds.`,
                variant: "destructive",
                duration: 5000
              });
              URL.revokeObjectURL(url);
              reject(new Error('Video too long'));
              return;
            }
            resolve();
          };
          video.onerror = () => {
            trackEvent('Video', 'upload_error', 'metadata_load_failed');
            toast({
              title: "Video Error",
              description: "Unable to process this video file. Please try a different video.",
              variant: "destructive",
              duration: 5000
            });
            URL.revokeObjectURL(url);
            reject(new Error('Video load failed'));
          };
        });

        trackEvent('Video', 'upload_success', file.type);
        URL.revokeObjectURL(url);

        if (onVideoUpload) {
          onVideoUpload(file);
        }
        return;
      }

      // Image flow
      if (file.size > MAX_IMAGE_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        trackImageUpload(false, `Image file size exceeded 10MB limit (${sizeMB}MB)`);
        toast({
          title: "Image Too Large",
          description: "Maximum image file size is 10MB. Please upload a smaller image.",
          variant: "destructive",
          duration: 5000
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (!dataUrl || !dataUrl.startsWith('data:image/')) {
          trackImageUpload(false, 'Invalid image data format');
          toast({
            title: "Image format error",
            description: "The file you selected doesn't appear to be a valid image. Please try a different file.",
            variant: "destructive",
            duration: 5000
          });
          return;
        }

        const img = new Image();
        img.onload = () => {
          if (img.width < 300 || img.height < 300) {
            trackImageUpload(false, `Image too small: ${img.width}x${img.height}`);
            toast({
              title: "Image too small",
              description: "For best results, please use a larger image. We recommend at least 1000×1500 pixels.",
              variant: "destructive",
              duration: 5000
            });
          }
          trackImageUpload(true);
          onImageUpload(dataUrl);
        };
        img.onerror = () => {
          trackImageUpload(false, 'Image loading error');
          toast({
            title: "Image loading failed",
            description: "We couldn't process this image. Please try another image.",
            variant: "destructive",
            duration: 5000
          });
          if (onImageError) {
            onImageError();
          }
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        trackImageUpload(false, 'FileReader error');
        toast({
          title: "Upload Error",
          description: "There was a problem processing your image. Please try a different image.",
          variant: "destructive",
          duration: 5000
        });
        if (onImageError) {
          onImageError();
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      // Handled via toasts above
    }
  };

  // Handle button click - open modal on mobile, trigger file input on desktop
  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMobile) {
      openModal();
    } else {
      // Directly trigger file input on non-mobile
      fileInputRef.current?.click();
    }
  };

  const handleContainerClick = () => {
    if (isMobile) {
      openModal();
    } else {
      // Directly trigger file input on non-mobile
      fileInputRef.current?.click();
    }
  };

  return (
    <div className={`w-full mx-auto flex justify-center items-center ${isMobile ? '' : 'mt-32 pt-16'}`} style={{ maxWidth: '350px' }}>
      <div className={`relative w-full`} style={{ height: 495, width: 389 }} onClick={handleContainerClick}>
        <div className={`absolute inset-0 border-0 bg-secondary rounded-lg cursor-pointer hover:bg-gray-100 transition-all`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-2">
            {isMobile && (
              <Button onClick={(e) => { e.stopPropagation(); openModal(); }} className='w-full inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-5 py-2 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-base'>
                Take Photo
              </Button>
            )}
            <Button onClick={handleUploadClick} className='w-full inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-5 py-2 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-base'>
              Upload from Library
            </Button>
            <p className="mt-4 text-sm text-gray-600">Images: JPG, PNG (max 10MB)</p>
            <p className="mt-1 text-sm text-gray-600">Videos: MP4, MOV, WebM (max 10 seconds)</p>
          </div>
        </div>
      </div>

      {/* Hidden file input for non-mobile devices */}
      {!isMobile && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      )}

      {/* Modal only shown on mobile */}
      {isMobile && (
        <ImageSourceModal
          isOpen={isModalOpen}
          onClose={closeModal}
        />
      )}
    </div>
  );
}