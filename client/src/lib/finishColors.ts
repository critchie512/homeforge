// Purely visual mapping from a laminate finish id (config-driven) to an
// approximate preview color for the end panels. This is a rendering
// convenience only — it has no bearing on manufacturability and is never
// read by the validation engine.
export const LAMINATE_FINISH_PREVIEW_COLORS: Record<string, string> = {
  "warm-oak": "#a9764f",
  charcoal: "#2b2a28",
  "bone-white": "#e8e2d6",
  "espresso-walnut": "#3c2a20",
};

export function getLaminateFinishPreviewColor(finishId: string): string {
  return LAMINATE_FINISH_PREVIEW_COLORS[finishId] ?? "#8a7a68";
}
