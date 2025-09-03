import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';

interface SelectedVideoFrame {
  frameDataUrl: string;
  timestamp: number;
  videoDuration: number;
  videoPath?: string;
}

interface VideoFrameSelectorProps {
  videoFile: File;
  videoPath: string | null;
  isUploadingVideo: boolean;
  onFrameSelected: (frameData: SelectedVideoFrame) => void;
  onCancel: () => void;
}

export default function VideoFrameSelector({
  videoFile,
  videoPath,
  isUploadingVideo,
  onFrameSelected,
  onCancel
}: VideoFrameSelectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');

  // Initialize video
  useEffect(() => {
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [videoFile]);

  // Capture frame at current video time
  const captureCurrentFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to data URL
    const frameDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setSelectedFrame(frameDataUrl);
  }, []);

  // Handle video metadata loaded
  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setCurrentTime(0);
      
      // Ensure video is at the beginning and capture initial frame
      videoRef.current.currentTime = 0;
    }
  }, []);

  // Handle when video can play (first frame is ready)
  const handleVideoCanPlay = useCallback(() => {
    if (videoRef.current) {
      // Capture initial frame when first frame is ready
      captureCurrentFrame();
    }
  }, [captureCurrentFrame]);

  // Handle time slider change
  const handleTimeChange = useCallback((values: number[]) => {
    const newTime = values[0];
    setCurrentTime(newTime);
    
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  }, []);

  // Handle video time update
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      captureCurrentFrame();
    }
  }, [captureCurrentFrame]);

  // Play/pause toggle
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Handle video ended
  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
  }, []);

  // Reset to beginning
  const handleReset = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlaying(false);
      captureCurrentFrame();
    }
  }, [captureCurrentFrame]);

  // Select this frame
  const handleSelectFrame = useCallback(() => {
    if (!selectedFrame) {
      toast({
        title: "No frame selected",
        description: "Please select a frame from the video.",
        variant: "destructive"
      });
      return;
    }

    // Check if video is still uploading
    if (isUploadingVideo) {
      toast({
        title: "Video still uploading",
        description: "Please wait for the video upload to complete before selecting a frame.",
        variant: "destructive"
      });
      return;
    }

    // Check if video path is available
    if (!videoPath) {
      toast({
        title: "Video upload incomplete",
        description: "The video upload failed or is incomplete. Please try uploading again.",
        variant: "destructive"
      });
      return;
    }

    trackEvent('Video', 'frame_selected', `${Math.round(currentTime)}s`);
    console.log('🎬 Selecting frame with video path:', videoPath);
    onFrameSelected({
      frameDataUrl: selectedFrame,
      timestamp: currentTime,
      videoDuration: duration,
      videoPath: videoPath
    });
  }, [selectedFrame, currentTime, duration, videoPath, isUploadingVideo, onFrameSelected]);

  // Format time for display
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <h2 className="text-xl md:text-2xl font-racing-sans mb-4 text-white text-center">Move the slider to the moment you want to poster.</h2>
      
      {/* Video Preview - Responsive with viewport-based sizing */}
      <div className="relative mb-6">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full rounded-lg shadow-lg"
          style={{ 
            maxHeight: '60vh', 
            minHeight: '300px',
            objectFit: 'contain',
            backgroundColor: '#000'
          }}
          onLoadedMetadata={handleVideoLoaded}
          onCanPlay={handleVideoCanPlay}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          muted
          preload="metadata"
        />
      </div>

      {/* Video Controls Below Video */}
      <div className="bg-gray-100 rounded-lg p-3 md:p-4 mb-6">
        <div className="flex items-center gap-2 md:gap-3 mb-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlayPause}
            className="text-gray-700 hover:text-gray-900 p-2"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="text-gray-700 hover:text-gray-900 p-2"
          >
            <RotateCcw size={16} />
          </Button>
          
          <span className="text-gray-700 text-xs md:text-sm ml-auto">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        
        {/* Time Slider */}
        <Slider
          value={[currentTime]}
          onValueChange={handleTimeChange}
          max={duration}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button
          onClick={onCancel}
          className="px-4 py-3 bg-gray-600 text-white rounded font-racing-sans hover:bg-gray-700 transition-colors duration-200 text-base md:text-lg"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSelectFrame}
          disabled={!selectedFrame || isUploadingVideo || !videoPath}
          className="px-4 py-3 bg-white text-black rounded font-racing-sans hover:bg-[#f1b917] transition-colors duration-200 text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploadingVideo ? 'Uploading Video...' : 'Use This Frame'}
        </Button>
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}