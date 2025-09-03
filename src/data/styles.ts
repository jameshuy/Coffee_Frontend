export interface StyleData {
  id: string;
  name: string;
  traits: string;
}

// Styles data with traits for prompt construction
export const STYLES: StyleData[] = [
  {
    id: "alpinecoastal",
    name: "Alpine Coastline",
    traits:
      "flat color planes, clean vector lines, stylized natural forms, and cinematic layering in muted coastal tones",
  },
  {
    id: "artdeco",
    name: "Art Deco",
    traits:
      "geometric abstraction, symmetrical composition, streamlined forms, and a limited palette of bold, elegant colors",
  },
  {
    id: "artnouveau",
    name: "Art Nouveau",
    traits:
      "flowing curves, botanical ornamentation, pastel and jewel tones, and elegant, elongated forms",
  },
  {
    id: "bauhaus",
    name: "Bauhaus",
    traits:
      "geometric shapes, minimal color palette, clean lines, and functional composition",
  },
  {
    id: "brutalistdecay",
    name: "Brutalist Decay",
    traits:
      "radial geometric patterns, high-contrast black-and-white forms, abstracted typography, and distressed surface textures",
  },
  {
    id: "crystallineindustry",
    name: "Crystalline Industry",
    traits:
      "fragmented texture composed of overlapping polygonal shards in varying shades of metallic silver, grey, white, blue, green, and yellow",
  },
  {
    id: "goldenglimpse",
    name: "Golden Glimpse",
    traits:
      "soft golden lighting, elegant glow, pastel warmth, and celebration-focused ambiance",
  },
  {
    id: "impressionist",
    name: "Impressionist",
    traits:
      "soft, visible brushstrokes, atmospheric light, and pastel color blending",
  },
  {
    id: "majolica",
    name: "Majolica",
    traits:
      "richly detailed, symmetrical tile motifs in a variety of vibrant colors, including yellows, blues, greens, and reds. Use bold black outlines and glossy, ceramic textures to simulate traditional hand-painted glazed tiles",
  },
  {
    id: "minimalmodernist",
    name: "Minimal Modernist",
    traits:
      "bold geometric simplification, clean flat shapes, and a limited palette of high-contrast colors. Remove textural detail and shadow, using unshaded color fields and architectural abstraction to convey form",
  },
  {
    id: "neoretromotor",
    name: "Neo-Retro Motor",
    traits:
      "angular color blocking, parallel stripe gradients, bold primary tones (such as red, yellow, black), and dynamic paneling",
  },
  {
    id: "neovintage",
    name: "Neo Vintage",
    traits:
      "bold color gradients, clean outlines, stylized forms, and mid-century poster composition",
  },
  {
    id: "novaprisma",
    name: "Nova Prisma",
    traits:
      "prismatic overlays, vibrant gradients, high-contrast lighting, and digital surreal textures",
  },
  {
    id: "parallelpop",
    name: "Parallel Pop",
    traits:
      "flat graphic forms, vibrant candy colors, bold outlines, and playful geometry",
  },
  {
    id: "popart",
    name: "Pop Art",
    traits:
      "vivid colors, thick black outlines, comic-style shading, and graphic simplicity",
  },
  {
    id: "renaissance",
    name: "Renaissance",
    traits: "color palette, chiaroscuro lighting, brushwork, and realism",
  },
  {
    id: "retrooptical",
    name: "Retro Optical",
    traits:
      "repeating zig-zag and waveform patterns with sharp geometric modulation, a gradient palette of warm yellows and oranges interspersed with greens and blues, and bold contrast to create rhythmic surface motion",
  },
  {
    id: "retroscenic",
    name: "Retro Scenic",
    traits:
      "sunset-inspired color palette, painterly textures, bold shading, and romanticized realism",
  },
  {
    id: "sepiahellenic",
    name: "Sepia Hellenic",
    traits:
      "fine linework, cross-hatching, warm sepia tones, parchment-textured background, and ornamental double-line borders",
  },
  {
    id: "surrealist",
    name: "Surrealist",
    traits: "dreamlike textures, symbolic distortions, and eerie lighting",
  },
  {
    id: "tuscanlavender",
    name: "Tuscan Lavender",
    traits:
      "flat-line illustrations, geometric landscape motifs, limited color palette (terracotta red, soft lavender, off-white), and classical regional balance",
  },
];

// Free styles available to all users
export const FREE_STYLES = ["alpinecoastal", "impressionist", "popart"];
