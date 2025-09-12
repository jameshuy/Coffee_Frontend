export type SlideshowMediaItem = { type: 'image' | 'video'; src: string };

// Media served from public/slideshow. Use absolute paths so Vite serves correctly.
export const SLIDESHOW_MEDIA: SlideshowMediaItem[] = [
  { type: 'video', src: '/slideshow/landing-video.mov' },
  { type: 'image', src: '/slideshow/5d.jpg' },
  { type: 'image', src: '/slideshow/coffee-cup-popart.jpg' },
  { type: 'image', src: '/slideshow/lamp-swissmidcentury.jpg' },
  { type: 'image', src: '/slideshow/tree-alpinecoastal.jpg' },
  { type: 'image', src: '/slideshow/building-minimalmodernist.jpg' },
  { type: 'image', src: '/slideshow/palms-impressionist.jpg' },
  { type: 'image', src: '/slideshow/trainview-alpinecoastal.jpg' },
  { type: 'image', src: '/slideshow/sunset-neovintage.jpg' },
];


