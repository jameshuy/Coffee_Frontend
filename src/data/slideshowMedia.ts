export type SlideshowMediaItem = { type: 'image' | 'video'; src: string };

// Media served from public/slideshow. Use absolute paths so Vite serves correctly.
export const SLIDESHOW_MEDIA: SlideshowMediaItem[] = [
  { type: 'video', src: '/slideshow/landing-video.mp4' },  // Ferrari in mirror video (optimized)
  { type: 'image', src: '/slideshow/ferrari-in-pop.jpg' },  // Ferrari in mirror pop art
  { type: 'image', src: '/slideshow/lamp-swissmidcentury.jpg' },
  { type: 'image', src: '/slideshow/tree-alpinecoastal.jpg' },
  { type: 'image', src: '/slideshow/building-minimalmodernist.jpg' },
  { type: 'image', src: '/slideshow/palms-impressionist.jpg' },
  { type: 'image', src: '/slideshow/sunset-neovintage.jpg' },
  { type: 'image', src: '/slideshow/mountain-travel.png' },  // Mountain landscape in travel style
  { type: 'image', src: '/slideshow/palms-bauhaus.png' },  // Bauhaus style palm trees
  { type: 'image', src: '/slideshow/coffee-popart-new.png' }  // Pop art coffee cup
];


