// Predefined palette of distinct category colors (HSL)
export const CATEGORY_COLORS = [
  "hsl(220, 70%, 55%)",  // Blue
  "hsl(340, 75%, 55%)",  // Rose
  "hsl(160, 60%, 45%)",  // Teal
  "hsl(30, 90%, 55%)",   // Orange
  "hsl(270, 60%, 58%)",  // Purple
  "hsl(50, 85%, 50%)",   // Yellow
  "hsl(190, 70%, 45%)",  // Cyan
  "hsl(0, 70%, 55%)",    // Red
  "hsl(130, 50%, 45%)",  // Green
  "hsl(300, 50%, 55%)",  // Magenta
];

export function getNextColor(usedColors: string[]): string {
  const available = CATEGORY_COLORS.find((c) => !usedColors.includes(c));
  return available ?? CATEGORY_COLORS[usedColors.length % CATEGORY_COLORS.length];
}
