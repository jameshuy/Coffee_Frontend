export interface StyleData {
  id: string;
  name: string;
  traits: string;
  palette: string;
  printFinish: string;
  edgeRule: string;
  iconic: Iconic;
}

export interface Iconic {
  maxHues: number;
  heroScaleRange: number[];
  minDetailPx: number;
}

// Styles data with traits for prompt construction
export const STYLES: StyleData[] = [
  {
    id: "impressionist",
    name: "Impressionist",
    traits:
      "vertical poster layout with soft atmospheric brushstrokes, diffused light and color blending, visible textured strokes that dissolve detail into luminous haze, warm natural palette of greens, yellows, and blues, emphasis on fleeting impressions of light and movement, natural landscapes rendered with vibrancy and spontaneity, impressionist painting aesthetic",
    palette: "4–5 colors: #3A6B35,#F4D35E,#F6AE2D,#4AA8D8,#FFFFFF",
    printFinish: "visible brushstroke texture, broken color, painterly grain",
    edgeRule: "soft blended edges; painterly dissolution",
    iconic: { maxHues: 5, heroScaleRange: [55, 70], minDetailPx: 10 }
  },
  {
    id: "minimalmodernist",
    name: "Minimal Modernist",
    traits:
      "vertical poster layout with bold geometric simplification, clean flat vector-like shapes, limited palette of saturated contrasting colors such as orange, teal, and yellow, removal of gradients and textures, sharp contours defining form through pure color fields, architectural abstraction with emphasis on balance and proportion, minimal modernist design aesthetic",
    palette: "3 colors: #F95738,#0FA3B1,#FFD23F",
    printFinish: "flat inks, no halftone, matte surface",
    edgeRule: "hard, posterized edges; no gradients",
    iconic: { maxHues: 3, heroScaleRange: [55, 70], minDetailPx: 14 }
  },
  {
    id: "neominimal",
    name: "Neo Minimal",
    traits:
      "vertical poster layout with extreme simplification into bold flat color fields, minimal contour lines defining form, unexpected vibrant palette such as pink, green, yellow, and navy, strong use of negative space, geometric abstraction with smooth curves, removal of texture and shading, contemporary neo-minimalist design aesthetic",
    palette: "4 colors: #FF5E84,#48BFE3,#FFED66,#233D4D",
    printFinish: "ultra-flat solid fill, no grain, smooth matte",
    edgeRule: "uniform hard contour lines, minimal thickness",
    iconic: { maxHues: 4, heroScaleRange: [60, 70], minDetailPx: 12 }
  },
  {
    id: "popart",
    name: "Pop Art",
    traits:
      "vertical poster layout with bold saturated background colors like red, yellow, and blue, central subject outlined in thick black lines, flat graphic shading with high contrast, halftone dot textures emulating vintage comic books, exaggerated highlights and shadows, simplified forms with playful energy, pop art aesthetic inspired by 1960s Roy Lichtenstein and Andy Warhol poster design",
    palette: "4 colors: #FEE440,#FF006E,#3A86FF,#000000",
    printFinish: "halftone dots, vintage comic texture, bold ink traps",
    edgeRule: "very hard edges with thick black contour",
    iconic: { maxHues: 4, heroScaleRange: [55, 70], minDetailPx: 16 }
  },
  {
    id: "psychedelicconcert",
    name: "Psychedelic Concert",
    traits:
      "vertical poster layout with swirling organic linework that distorts and flows around the subject, vibrant high-contrast complementary colors like electric blues, acid yellows, hot pinks, and deep purples, bold black outlines integrating the subject into the fluid background, warped hypnotic shapes creating visual vibration, textured finish emulating vintage screen-print ink with uneven registration, late-1960s psychedelic concert poster aesthetic",
    palette: "5 colors: #FF006E,#8338EC,#3A86FF,#FFBE0B,#000000",
    printFinish: "screen-print ink texture, uneven registration allowed",
    edgeRule: "bold black outline around hero; flowing organic contours",
    iconic: { maxHues: 5, heroScaleRange: [55, 65], minDetailPx: 12 }
  },
  {
    id: "swissmidcentury",
    name: "Swiss Mid-Century",
    traits:
      "vertical poster layout with off-white paper background, bold diagonal red geometric shapes, high-contrast black and grey tones, sharp edges with exaggerated metallic highlights, isolated photorealistic subjects, subtle grain and halftone texture emulating vintage print stock, mid-century Swiss watch advertisement aesthetic",
    palette: "3 colors: #FFFFFF,#D62828,#111111",
    printFinish: "fine halftone texture, slight metallic ink sheen",
    edgeRule: "sharp edges; clean geometry; no gradients",
    iconic: { maxHues: 3, heroScaleRange: [60, 70], minDetailPx: 12 }
  },
  {
    id: "seasidesimple",
    name: "Seaside Simple",
    traits:
      "vertical poster layout with clean horizontal color bands evoking sea, sand, and sky, simplified forms outlined in bold black, flat color fills with subtle halftone shading, limited palette of yellow, teal, cream, and navy, minimal detail with emphasis on graphic balance, calm coastal atmosphere rendered in a modernist seaside poster style",
    palette: "4 colors: #F4D35E,#0FA3B1,#EAE2B7,#001219",
    printFinish: "flat fills with light halftone shade on horizon",
    edgeRule: "thick black outlines with minimal texture",
    iconic: { maxHues: 4, heroScaleRange: [50, 65], minDetailPx: 12 }
  }
];

// Free styles available to all users
export const FREE_STYLES = ["alpinecoastal", "impressionist", "popart"];
