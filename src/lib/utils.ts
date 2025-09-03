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
  const validFeelingIds = feelingIds.filter((id) => id && id.trim() !== "");
  const selectedFeelings = validFeelingIds.map((id) => {
    const feeling = FEELINGS.find((f) => f.id === id);
    if (!feeling) {
      throw new Error(`Feeling not found: ${id}`);
    }
    return feeling;
  });

  let prompt = `Create a poster of the first image. Use the second image strictly as a reference for the ${style.name} style. Apply its visual characteristics— ${style.traits} —to the first image. Do not use or replicate any content, objects, layout, forms, or shapes from the second image. Preserve the exact subject, composition, and proportions of the first image only. This is a style transfer. Do not reinterpret the subject. Do not merge scenes. Do not borrow geometry or elements like houses, buildings, mountains, clouds, or terrain features from the second image. Do not add any borders, frames, or text.\n`;

  if (selectedFeelings.length > 0) {
    prompt += `Enrich the image with subtle influence from the following emotional directions. These should enhance the style without disrupting the original photo's structure or overpowering the chosen style:\n`;

    if (selectedFeelings[0]) {
      prompt += `1. ${selectedFeelings[0].name} –  ${selectedFeelings[0].traits}\n`;
    }
    if (selectedFeelings[1]) {
      prompt += `2. ${selectedFeelings[1].name} – ${selectedFeelings[1].traits}\n`;
    }
    if (selectedFeelings[2]) {
      prompt += `3. ${selectedFeelings[2].name} – ${selectedFeelings[2].traits}\n`;
    }
  }

  prompt += `Render the final output as a high-quality, print-ready poster in A3 aspect ratio (297 × 420 mm). Apply visual textures and finishes reminiscent of professional art print methods—such as risograph layering, halftone ink, screenprint overlays, or matte paper surface—to emphasize physical materiality and gallery-grade production.`;

  return prompt;
}
