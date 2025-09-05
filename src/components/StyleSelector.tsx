import { Card } from '@/components/ui/card';
import { useEffect, useRef, useState, useCallback } from 'react';
import { trackStyleSelection, trackEvent } from '@/lib/analytics';
import { ChevronUp, ChevronDown } from 'lucide-react';
// Object Storage paths to style thumbnails (alphabetically ordered, via direct API routes)
// These paths use our storage-image endpoint that serves from Object Storage
const alpinecoastal_thumbnail = '/api/storage-image/styles/thumbnails/alpinecoastal_thumbnail.png';
const artdecoThumbnail = '/api/storage-image/styles/thumbnails/artdeco_thumbnail.png';
const artnouveauThumbnail = '/api/storage-image/styles/thumbnails/artnouveau_thumbnail.png';
const bauhausThumbnail = '/api/storage-image/styles/thumbnails/bauhaus_thumbnail.png';
const brutalistdecayThumbnail = '/api/storage-image/styles/thumbnails/brutalistdecay_thumbnail.png';
const crystallineindustryThumbnail = '/api/storage-image/styles/thumbnails/crystallineindustry_thumbnail.png';
const goldenglimpseThumbnail = '/api/storage-image/styles/thumbnails/goldenglimpse_thumbnail.png';
const impressionistThumbnail = '/api/storage-image/styles/thumbnails/impressionist_thumbnail.png';
const minimalmodernistThumbnail = '/api/storage-image/styles/thumbnails/minimalmodernist_thumbnail.png';
const neoretromotorThumbnail = '/api/storage-image/styles/thumbnails/neoretromotor_thumbnail.png';
const neovintageThumbnail = '/api/storage-image/styles/thumbnails/neovintage_thumbnail.png';
const novaprismaThumbail = '/api/storage-image/styles/thumbnails/novaprisma_thumbnail.png';
const parallelpopThumbnail = '/api/storage-image/styles/thumbnails/parallelpop_thumbnail.png';
const popartThumbnail = '/api/storage-image/styles/thumbnails/popart_thumbnail.png';
const renaissanceThumbnail = '/api/storage-image/styles/thumbnails/renaissance_thumbnail.png';
const retrooptical_thumbnail = '/api/storage-image/styles/thumbnails/retrooptical_thumbnail.png';
const retroscenicThumbnail = '/api/storage-image/styles/thumbnails/retroscenic_thumbnail.png';
const sepiahellenic_thumbnail = '/api/storage-image/styles/thumbnails/sepiahellenic_thumbnail.png';
const surrealistThumbnail = '/api/storage-image/styles/thumbnails/surrealist_thumbnail.png';
const majolicaThumbnail = '/api/storage-image/styles/thumbnails/majolica_thumbnail.png';
const tuscanlavenderThumbnail = '/api/storage-image/styles/thumbnails/tuscanlavender_thumbnail.png';

import { type StyleData } from '@/data';

interface StyleSelectorProps {
  styles: StyleData[];
  selectedStyle: StyleData;
  onSelectStyle: (style: StyleData) => void;
  showAsButton?: boolean;
  onPickStyleClick?: () => void;
}

// Helper function to get the correct thumbnail image based on style ID
function getStyleThumbnailPath(styleId: string) {
  switch (styleId) {
    // Alphabetically ordered for easier maintenance
    case 'alpinecoastal':
      return alpinecoastal_thumbnail;
    case 'artdeco':
      return artdecoThumbnail;
    case 'artnouveau':
      return artnouveauThumbnail;
    case 'bauhaus':
      return bauhausThumbnail;
    case 'brutalistdecay':
      return brutalistdecayThumbnail;
    case 'crystallineindustry':
      return crystallineindustryThumbnail;
    case 'goldenglimpse':
      return goldenglimpseThumbnail;
    case 'impressionist':
      return impressionistThumbnail;
    case 'minimalmodernist':
      return minimalmodernistThumbnail;
    case 'neoretromotor':
      return neoretromotorThumbnail;
    case 'neovintage':
      return neovintageThumbnail;
    case 'novaprisma':
      return novaprismaThumbail;
    case 'parallelpop':
      return parallelpopThumbnail;
    case 'popart':
      return popartThumbnail;
    case 'renaissance':
      return renaissanceThumbnail;
    case 'retrooptical':
      return retrooptical_thumbnail;
    case 'retroscenic':
      return retroscenicThumbnail;
    case 'sepiahellenic':
      return sepiahellenic_thumbnail;
    case 'surrealist':
      return surrealistThumbnail;
    case 'majolica':
      return majolicaThumbnail;
    case 'tuscanlavender':
      return tuscanlavenderThumbnail;
    default:
      return '';
  }
}

export function StyleSelector({
  styles,
  selectedStyle,
  onSelectStyle,
  showAsButton = false,
  onPickStyleClick,
}: StyleSelectorProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Item height for snap positioning (card height + spacing)
  const ITEM_HEIGHT = 420; // Increased for bigger thumbnails (360px + padding)
  const VISIBLE_ITEMS = 3; // Show only 3 items (one full + two halves)
  const CENTER_INDEX = Math.floor(VISIBLE_ITEMS / 2);
  
  // Function to scroll the page to show the "poster the moment" button
  const scrollToGenerateButton = useCallback(() => {
    setTimeout(() => {
      const generateButton = document.getElementById('create-poster-button');
      
      if (generateButton) {
        generateButton.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
      } else {
        const container = document.querySelector('main');
        if (container) {
          window.scrollTo({
            top: container.getBoundingClientRect().bottom + window.pageYOffset - window.innerHeight + 100,
            behavior: 'smooth'
          });
        }
      }
    }, 200);
  }, []);
  
  // Snap to position function
  const snapToPosition = useCallback((index: number) => {
    if (!scrollContainerRef.current) return;
    
    setIsScrolling(true);
    // Center the thumbnail perfectly in the 462px container
    const containerHeight = 462;
    const paddingTop = 231;
    const targetScrollTop = (index * ITEM_HEIGHT) + paddingTop - (containerHeight / 2);
    
    scrollContainerRef.current.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
    
    setTimeout(() => {
      setIsScrolling(false);
    }, 300);
  }, [ITEM_HEIGHT]);
  
  // Scroll to a specific index
  const scrollToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
    const style = styles[index];
    if (style) {
      trackStyleSelection(style.id, style.name);
      trackEvent('Customize', 'select_style', style.name);
      onSelectStyle(style);
      snapToPosition(index);
    }
  }, [styles, onSelectStyle, snapToPosition]);

  // Handle manual style selection (click)
  const handleSelectStyle = useCallback((style: StyleData, index: number) => {
    trackStyleSelection(style.id, style.name);
    trackEvent('Customize', 'select_style', style.name);
    
    onSelectStyle(style);
    setCurrentIndex(index);
    snapToPosition(index);
    // Removed auto-scroll to generate button
  }, [onSelectStyle, snapToPosition]);
  
  // Initialize with selected style index and ensure proper initial positioning
  useEffect(() => {
    const initialIndex = styles.findIndex(style => style.id === selectedStyle?.id);
    if (initialIndex !== -1) {
      setCurrentIndex(initialIndex);
      // Immediately set the correct scroll position without animation
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const containerHeight = 462;
          const paddingTop = 231;
          const targetScrollTop = (initialIndex * ITEM_HEIGHT) + paddingTop - (containerHeight / 2);
          scrollContainerRef.current.scrollTop = Math.max(0, targetScrollTop);
        }
      }, 100);
    } else if (styles.length > 0) {
      // Default to first style if no selection - ensure style is actually selected
      const firstStyle = styles[0];
      setCurrentIndex(0);
      onSelectStyle(firstStyle); // Make sure the first style is actually selected
      setTimeout(() => {
        if (scrollContainerRef.current) {
          const containerHeight = 462;
          const paddingTop = 231;
          const targetScrollTop = paddingTop - (containerHeight / 2);
          scrollContainerRef.current.scrollTop = Math.max(0, targetScrollTop);
        }
      }, 100);
    }
  }, [styles, selectedStyle, ITEM_HEIGHT, onSelectStyle]);
  
  // Passive scroll handler - only updates visual state, no automatic scrolling
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    let scrollTimeout: NodeJS.Timeout;
    
    const onScroll = () => {
      if (isScrolling) return; // Skip during programmatic scrolling
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollTop = scrollContainer.scrollTop;
        const containerHeight = 462;
        const paddingTop = 231;
        // Fix the calculation - the visible center is at scrollTop + half container height
        const visibleCenter = scrollTop + (containerHeight / 2);
        // Subtract padding to get the actual position in content
        const contentPosition = visibleCenter - paddingTop;
        // Calculate index based on content position
        const newIndex = Math.round(contentPosition / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(newIndex, styles.length - 1));
        
        // Update visual state AND actually select the style
        if (clampedIndex !== currentIndex) {
          setCurrentIndex(clampedIndex);
          const style = styles[clampedIndex];
          if (style && style.id !== selectedStyle?.id) {
            trackStyleSelection(style.id, style.name);
            trackEvent('Customize', 'select_style', style.name);
            onSelectStyle(style);
          }
        }
      }, 50);
    };
    
    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener('scroll', onScroll);
      clearTimeout(scrollTimeout);
    };
  }, [currentIndex, isScrolling, ITEM_HEIGHT]);
  
  // Button functionality removed - always show carousel

  return (
    <div className="w-full mt-12 mb-12 flex flex-col items-center styles-palette-container">
      {/* Main container with arrows and carousel */}
      <div className="flex items-center gap-2">
        {/* Left navigation arrows */}
        <div className="flex flex-col gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              const container = scrollContainerRef.current;
              if (container && currentIndex > 0) {
                const newIndex = currentIndex - 1;
                scrollToIndex(newIndex);
              }
            }}
            disabled={currentIndex === 0}
            className={`bg-gray-800/80 p-2 rounded-full transition-colors ${
              currentIndex > 0 ? 'hover:bg-gray-700' : 'opacity-50 cursor-not-allowed'
            }`}
            aria-label="Previous style"
          >
            <ChevronUp size={20} className="text-gray-300" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              const container = scrollContainerRef.current;
              if (container && currentIndex < styles.length - 1) {
                const newIndex = currentIndex + 1;
                scrollToIndex(newIndex);
              }
            }}
            disabled={currentIndex === styles.length - 1}
            className={`bg-gray-800/80 p-2 rounded-full transition-colors ${
              currentIndex < styles.length - 1 ? 'hover:bg-gray-700' : 'opacity-50 cursor-not-allowed'
            }`}
            aria-label="Next style"
          >
            <ChevronDown size={20} className="text-gray-300" />
          </button>
        </div>
        
        {/* Carousel container - constrained to thumbnail width + highlight space */}
        <div className="relative mx-auto" style={{ width: '280px' }}>
          {/* Fade overlay at top and bottom */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black to-transparent pointer-events-none z-20" />
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
        

        
        {/* Vertical scrollable container - compact height */}
        <div 
          ref={scrollContainerRef}
          className="h-[462px] overflow-y-auto overflow-x-hidden relative"
          style={{ 
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Top spacer to center first item */}
          <div style={{ height: '191px', flexShrink: 0 }} />
          
          {styles.map((style, index) => {
            const isCenter = index === currentIndex;
            const distanceFromCenter = Math.abs(index - currentIndex);
            const opacity = Math.max(0.6, 1 - (distanceFromCenter * 0.2));
            const scale = isCenter ? 1 : 0.95;
            
            return (
              <div 
                key={style.id} 
                className="flex flex-col items-center justify-start cursor-pointer transition-all duration-300"
                style={{ 
                  height: ITEM_HEIGHT + 'px',
                  scrollSnapAlign: 'center',
                  opacity,
                  transform: 'scale(' + scale + ')',
                  padding: '10px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onClick={() => handleSelectStyle(style, index)}
              >
                {/* Style thumbnail - 20% BIGGER */}
                <div 
                  className={`relative overflow-hidden cursor-pointer transition-all duration-300 flex-shrink-0 ${
                    isCenter ? 'ring-4 ring-offset-2 ring-[#ffd700] scale-[1.05] shadow-lg shadow-[#ffd700]/50' : 'hover:scale-[1.02]'
                  }`}
                  style={{ width: '240px', height: '360px', touchAction: 'manipulation' }}
                >
                  <div className="relative flex items-center justify-center w-full h-full bg-black p-0">
                    <img
                      src={getStyleThumbnailPath(style.id)}
                      alt={style.name}
                      className="w-full h-full object-cover"
                      style={{ pointerEvents: 'auto' }}
                      draggable="false"
                    />
                  </div>
                </div>
                
                {/* Style name below thumbnail - 20% BIGGER */}
                <div className={`text-center mt-3 w-full ${isCenter ? 'text-[#ffd700]' : 'text-white'} transition-colors duration-300`}>
                  <span className={`text-base font-racing-sans ${isCenter ? 'font-bold' : 'font-medium'}`}>{style.name}</span>
                </div>
              </div>
            );
          })}
          
          {/* Bottom spacer to center last item */}
          <div style={{ height: '191px', flexShrink: 0 }} />
        </div>
      </div>
    </div>
  </div>
  );
}