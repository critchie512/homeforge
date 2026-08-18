// Purely visual mapping from a finish id (config-driven) to an approximate
// preview color. This is a rendering convenience only — it has no bearing
// on manufacturability and is never read by the validation engine.
export const FINISH_PREVIEW_COLORS: Record<string, string> = {
  charcoal: "#2b2a28",
  "warm-oak": "#a9764f",
  "forge-orange": "#c9531e",
  "bone-white": "#e8e2d6",
};

export function getFinishPreviewColor(finishId: string): string {
  return FINISH_PREVIEW_COLORS[finishId] ?? "#8a7a68";
}
