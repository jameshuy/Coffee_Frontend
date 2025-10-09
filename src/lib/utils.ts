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
  let prompt = `Render the first image exactly as composed, preserving its subject and proportions, 
  but fully re-express it in the visual style of the second image for high-resolution A3 travel poster printing. 
  Do not add any objects or text that is not in the first image.`;

  return prompt;
}


