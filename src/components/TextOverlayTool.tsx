import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Check, X } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

interface TextOverlayToolProps {
  onSave: (textOverlay: { text: string, position: { x: number, y: number } }) => void;
  onCancel: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
  initialText?: string;
  initialPosition?: { x: number, y: number };
}

export default function TextOverlayTool({
  onSave,
  onCancel,
  containerRef,
  initialText = '',
  initialPosition = { x: 0, y: 0 }
}: TextOverlayToolProps) {
  const [text, setText] = useState(initialText);
  const x = useMotionValue(initialPosition.x);
  const y = useMotionValue(initialPosition.y);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [textSize, setTextSize] = useState({ width: 0, height: 0 });
  const textRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Initialize container and text sizes
  useEffect(() => {
    const updateSizes = () => {
      if (containerRef.current && textRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const textRect = textRef.current.getBoundingClientRect();
        
        setContainerSize({
          width: containerRect.width,
          height: containerRect.height
        });
        
        setTextSize({
          width: textRect.width,
          height: textRect.height
        });
      }
    };
    
    // Initial size calculation
    updateSizes();
    
    // Also recalculate when text changes (which might change text element size)
    const resizeObserver = new ResizeObserver(updateSizes);
    if (textRef.current) {
      resizeObserver.observe(textRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [containerRef, text]);
  
  // Position text initially
  useEffect(() => {
    if (containerSize.width && containerSize.height) {
      // If no initial position or zero position, center the text
      if (initialPosition.x === 0 && initialPosition.y === 0) {
        const centerX = (containerSize.width - textSize.width) / 2;
        const centerY = (containerSize.height - textSize.height) / 2;
        
        x.set(centerX);
        y.set(centerY);
      } else {
        // Use the provided initial position
        x.set(initialPosition.x);
        y.set(initialPosition.y);
      }
    }
  }, [containerSize, textSize, initialPosition, x, y]);
  
  // Set up auto-focus
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };
  
  // Calculate drag constraints
  const dragConstraints = {
    top: 10,
    left: 10,
    right: containerSize.width - textSize.width - 10,
    bottom: containerSize.height - textSize.height - 10
  };
  
  // Handle save button click
  const handleSave = () => {
    if (text.trim()) {
      // Get current position values
      const currentX = x.get();
      const currentY = y.get();
      
      console.log("Saving text with position:", { x: currentX, y: currentY });
      trackEvent('Customization', 'text_saved');
      
      // Ensure we have valid position values
      onSave({ 
        text, 
        position: { 
          x: isNaN(currentX) ? 0 : currentX, 
          y: isNaN(currentY) ? 0 : currentY 
        } 
      });
    }
  };
  
  // Handle cancel button click
  const handleCancel = () => {
    trackEvent('Customization', 'text_cancelled');
    onCancel();
  };
  
  return (
    <div className="absolute inset-0 z-30">
      {/* Semi-transparent overlay for click handling */}
      <div className="absolute inset-0 bg-black bg-opacity-10" onClick={handleCancel} />
      
      {/* Instagram-like instruction indicator */}
      <div className="absolute top-2 left-0 right-0 text-center pointer-events-none">
        <div className="inline-block bg-black bg-opacity-70 text-white text-xs py-1 px-3 rounded-full">
          Drag text to position
        </div>
      </div>
      
      {/* Draggable text element */}
      <motion.div
        ref={textRef}
        drag
        dragMomentum={false}
        dragElastic={0}
        dragConstraints={dragConstraints}
        style={{
          x,
          y,
          position: 'absolute',
          touchAction: 'none' // Prevent scrolling while dragging on mobile
        }}
        className="cursor-move"
      >
        <div className="relative bg-transparent">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder="Enter your text"
            className="bg-transparent border-none text-white text-2xl font-bold p-2 outline-none text-center min-w-[200px]"
            style={{ 
              textShadow: '2px 2px 4px rgba(0,0,0,0.8)', 
              caretColor: '#f1b917'
            }}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && text.trim()) {
                handleSave();
              }
            }}
          />
        </div>
      </motion.div>
      
      {/* Control buttons - Instagram style */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6">
        <Button 
          onClick={handleCancel}
          className="rounded-full w-14 h-14 flex items-center justify-center bg-black bg-opacity-70 hover:bg-opacity-90 border border-gray-500"
        >
          <X size={28} className="text-white" />
        </Button>
        <Button 
          onClick={handleSave}
          className="rounded-full w-14 h-14 flex items-center justify-center bg-[#f1b917] hover:bg-opacity-90"
          disabled={!text.trim()}
        >
          <Check size={28} className="text-white" />
        </Button>
      </div>
    </div>
  );
}