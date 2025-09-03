export type SlideshowMediaItem = { type: 'image' | 'video'; src: string };

// Media served from public/slideshow. Use absolute paths so Vite serves correctly.
export const SLIDESHOW_MEDIA: SlideshowMediaItem[] = [
  { type: 'video', src: '/slideshow/landing-video.mov' },
  { type: 'image', src: '/slideshow/5a.jpg' },
  { type: 'image', src: '/slideshow/5b.jpg' },
  { type: 'image', src: '/slideshow/5c.jpg' },
  { type: 'image', src: '/slideshow/5d.jpg' },
  { type: 'image', src: '/slideshow/5e.jpg' },
  { type: 'image', src: '/slideshow/5f.jpg' },
  { type: 'image', src: '/slideshow/5g.jpg' },
];


