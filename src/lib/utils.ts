import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { STYLES, FEELINGS } from "@/data"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Prompt construction function
export function constructPrompt(styleId: string, feelingIds: string[]): string {
  const style = STYLES.find((s) => s.id === styleId);
  if (!style) {
    throw new Error(`Style not found: ${styleId}`);
  }

  // Filter out empty feeling slots
  let prompt = `STYLE TRANSFER — ICONIC POSTER (Hero Cluster v1)

Source = FIRST image (LOCK composition & native subject proportions; analyze but do not invent).
Style = SECOND image (REFERENCE FOR SURFACE ONLY): ${style.name}.

SURFACE LANGUAGE (FROM STYLE, NOT CONTENT):
${style.traits}

COLOR DISCIPLINE:
• Cap palette to ${style.palette}; quantize to ≤ ${style.iconic?.maxHues ?? 4} dominant hues.
• CMYK-friendly tones only; avoid neon clipping/banding.

EDGE & TEXTURE LANGUAGE:
• Edge language: ${style.edgeRule}.
• Print finish cues: ${style.printFinish}.

ICONIC COMPOSITION LOCKS (NO NEW OBJECTS):
• Hero lock: Identify 2–3 (max 4) most distinct aspects from the source. Keep only those as Heroes; reduce all else.
• Hero cluster scale: Together Heroes should occupy ~55–70% of canvas height.
• Reduction: Flatten shading into halftone + bold fills; prune features < ${style.iconic?.minDetailPx ?? 12}px.
• Silhouette priority: Heroes must read as bold comic silhouettes.
• Balance: Heroes must form a playful, high-contrast cluster.
• Large quiet negative space is desirable.

PAPER-WHITE & BACKGROUND:
• Empty zones must be pure #FFFFFF with no halftone/tint.
• Full-bleed output; no fabricated borders or frames.

STRICT NEGATIVE (HARD REFUSALS):
• No new objects, text, logos, signatures, overlays, gradients, or pattern fills.
• No AI artifacts: double outlines, melted forms, speckling.

QUALITY SAFEGUARDS:
• Stamp test: Heroes recognizable at 128 px.
• Palette compliance: ≤ ${style.iconic?.maxHues ?? 4} hues; extras collapse to listed ones.
• Paper-white check: background must be exact #FFFFFF.
• Edge cleanliness: contours must remain sharp, no speckle.

OUTPUT SPECS:
• A3 (297×420 mm), 300 DPI, borderless.
• Deliver a clean, gallery-grade print-ready poster.`;

  return prompt;
}


