import React, { useRef, useState } from "react";
import { Camera, Image as ImageIcon } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { useDeviceInfo } from "@/hooks/check-device";
import { toast } from "@/hooks/use-toast";
import { trackEvent, trackImageUpload } from "@/lib/analytics";
import { useLocation } from "wouter";

type ImageSourceModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_DURATION = 10; // seconds

// Storage for File objects that can't be serialized through CustomEvent
export const videoFileStorage = new Map<string, File>();
let videoFileIdCounter = 0;

export default function ImageSourceModal({ isOpen, onClose }: ImageSourceModalProps) {
    const { isMobile } = useDeviceInfo();
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const libraryInputRef = useRef<HTMLInputElement>(null);
    const [location, navigate] = useLocation();

    // Local states similar to useCreateFlow (scoped to modal lifecycle)
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
    const [uploadedVideoPath, setUploadedVideoPath] = useState<string | null>(null);
    const [videoFrameData, setVideoFrameData] = useState<{ frameDataUrl: string; timestamp: number; videoDuration: number; videoPath?: string } | null>(null);
    const [isUploadingVideo, setIsUploadingVideo] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);

    const handlePick = (kind: "camera" | "library") => {
        if (kind === "camera") {
            cameraInputRef.current?.click();
        } else {
            libraryInputRef.current?.click();
        }
    };

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
        const file = e.target.files && e.target.files[0];
        e.currentTarget.value = ""; // reset early
        if (!file) return;

        try {
            // Video flow
            if (file.type.startsWith('video/')) {
                setIsUploadingVideo(true);
                setUploadedVideo(file);
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
                            setIsUploadingVideo(false);
                            setError('video_too_long');
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
                        setIsUploadingVideo(false);
                        setError('video_load_failed');
                        reject(new Error('Video load failed'));
                    };
                });

                trackEvent('Video', 'upload_success', file.type);
                // Local state updates to mirror create flow
                setUploadedVideo(file);
                setUploadedVideoPath(null);
                setVideoFrameData(null);

                // Store File object and pass ID through event (File objects can't be serialized)
                const fileId = `video_${Date.now()}_${++videoFileIdCounter}`;
                videoFileStorage.set(fileId, file);
                // Clean up after 5 minutes
                setTimeout(() => videoFileStorage.delete(fileId), 5 * 60 * 1000);

                if (location !== "/create") {
                    navigate("/create");
                    setTimeout(() => {
                        try {
                            window.dispatchEvent(new CustomEvent("videoSelectedForCreate", { detail: { fileId } }));
                        } catch { }
                    }, 100);
                } else {
                    try {
                        window.dispatchEvent(new CustomEvent("videoSelectedForCreate", { detail: { fileId } }));
                    } catch { }
                }
                URL.revokeObjectURL(url);
                setIsUploadingVideo(false);
                onClose();
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
                setError('image_too_large');
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
                    setError('invalid_image_data');
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
                    setUploadedImage(dataUrl);
                    if (location !== "/create") {
                        navigate("/create");
                        setTimeout(() => {
                            try {
                                window.dispatchEvent(new CustomEvent("imageSelectedForCreate", { detail: { imageDataUrl: dataUrl } }));
                            } catch { }
                        }, 0);
                    } else {
                        try {
                            window.dispatchEvent(new CustomEvent("imageSelectedForCreate", { detail: { imageDataUrl: dataUrl } }));
                        } catch { }
                    }
                    onClose();
                };
                img.onerror = () => {
                    trackImageUpload(false, 'Image loading error');
                    toast({
                        title: "Image loading failed",
                        description: "We couldn't process this image. Please try another image.",
                        variant: "destructive",
                        duration: 5000
                    });
                    setError('image_load_failed');
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
                setError('filereader_error');
            };
            reader.readAsDataURL(file);
        } catch (err) {
            // Handled via toasts above
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogOverlay className="pointer-events-none backdrop-blur-sm" />
            <DialogContent
                className={
                    // Bottom sheet styles
                    "fixed inset-x-0 bottom-0 left-0 right-0 z-[90] w-full translate-x-0 translate-y-0 border-0 bg-zinc-900 text-white shadow-2xl p-0 sm:max-w-none sm:rounded-none sm:left-0 sm:top-auto sm:translate-x-0 sm:translate-y-0 " +
                    // Rounded top and safe-area padding
                    "rounded-t-2xl pb-[env(safe-area-inset-bottom)] " +
                    // Slide up/down animations using radix data-state
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-bottom-1/2 data-[state=closed]:slide-out-to-bottom-1/2"
                }
                style={{ bottom: "calc(env(safe-area-inset-bottom) + 64px)" }}
            >
                <div className="py-2">
                    <div className="mx-auto h-1.5 w-12 rounded-full bg-zinc-700 my-3" />
                    <div className="px-4">
                        <DialogTitle className="text-center text-base font-medium">Select image or video</DialogTitle>
                    </div>
                    <div className="px-4 pb-2">
                        <h3 className="text-center text-sm text-zinc-400">Create from</h3>
                    </div>

                    <div className="flex flex-col">
                        <button
                            onClick={() => handlePick("camera")}
                            className="flex items-center gap-3 px-5 py-4 active:bg-zinc-800"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                                <Camera size={20} />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-base">Camera</span>
                                <span className="text-xs text-zinc-400">Take a new photo</span>
                            </div>
                        </button>

                        <div className="h-px w-full bg-zinc-800" />

                        <button
                            onClick={() => handlePick("library")}
                            className="flex items-center gap-3 px-5 py-4 active:bg-zinc-800"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                                <ImageIcon size={20} />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-base">Library</span>
                                <span className="text-xs text-zinc-400">Choose from photos</span>
                            </div>
                        </button>
                    </div>

                    <div className="mt-2 px-4 pb-4">
                        <button
                            onClick={onClose}
                            className="w-full rounded-xl bg-zinc-800 py-3 text-center text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* Hidden inputs for camera/library */}
                <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    // capture attribute is respected on many mobile browsers
                    capture={isMobile ? "environment" : undefined}
                    onChange={handleChange}
                    className="hidden"
                />
                <input
                    ref={libraryInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleChange}
                    className="hidden"
                />
            </DialogContent>
        </Dialog>
    );
}


