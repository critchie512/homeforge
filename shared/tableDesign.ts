// ---------------------------------------------------------------------------
// HomeForge — single source of truth for the coffee table parameter object.
//
// Both the interactive 3D preview (client/src/components/TablePreview.tsx)
// and the manufacturability validation engine (validateTableDesign below)
// consume the exact same TableParams shape and the exact same constraints
// file (config/production-constraints.json). Nothing about geometry or
// limits should ever be duplicated or hard-coded elsewhere — if the preview
// and the validator ever need different numbers, add a field here instead
// of forking logic.
// ---------------------------------------------------------------------------

export const TOP_SHAPES = ["rectangle", "round", "oval"] as const;
export type TopShape = (typeof TOP_SHAPES)[number];

export const BASE_STYLES = ["pedestal", "four-leg", "trestle"] as const;
export type BaseStyle = (typeof BASE_STYLES)[number];

export interface TableParams {
  widthMm: number;
  depthMm: number;
  heightMm: number;
  topShape: TopShape;
  baseStyle: BaseStyle;
  materialId: string;
  finishId: string;
}

export const DEFAULT_TABLE_PARAMS: TableParams = {
  widthMm: 1100,
  depthMm: 600,
  heightMm: 420,
  topShape: "rectangle",
  baseStyle: "four-leg",
  materialId: "pla-matte",
  finishId: "warm-oak",
};

// --- Production constraints -------------------------------------------------
// Shape mirrors config/production-constraints.json exactly. Loaded from disk
// on the server; bundled at build time on the client (see
// client/src/lib/productionConstraints.ts) — both read the SAME json file,
// never a hard-coded duplicate.

export interface ProductionConstraints {
  revision: string;
  units: Record<string, string>;
  dimensions: {
    width: { min: number; max: number };
    depth: { min: number; max: number };
    height: { min: number; max: number };
  };
  structure: {
    minWallThicknessMm: number;
    maxWallThicknessMm: number;
    defaultWallThicknessMm: number;
    minLegDiameterMm: number;
  };
  materials: Array<{
    id: string;
    label: string;
    densityKgPerM3: number;
    printSpeedFactor: number;
  }>;
  finishes: Array<{ id: string; label: string }>;
  estimation: {
    baseHoursPerLiter: number;
  };
}

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  code: string;
  field: keyof TableParams | "general";
  severity: ValidationSeverity;
  message: string;
}

export interface EstimatedMetrics {
  estimatedPrintTimeHours: number;
  estimatedMaterialWeightKg: number;
  estimatedVolumeLiters: number;
  isPlaceholderEstimate: true;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  estimate: EstimatedMetrics;
  constraintsRevision: string;
}

/**
 * Approximate solid volume of the tabletop + a simplified base, used only to
 * derive PLACEHOLDER estimated print time / weight. This is intentionally a
 * rough box-and-legs approximation, not real slicer output.
 */
function approximateVolumeLiters(params: TableParams, wallThicknessMm: number): number {
  const { widthMm, depthMm, heightMm, topShape } = params;

  // Tabletop: treat as a shell (thin slab) with shape-based area factor.
  const topThicknessMm = Math.max(wallThicknessMm, 18);
  const areaFactor = topShape === "round" ? 0.785 : topShape === "oval" ? 0.86 : 1;
  const topAreaMm2 = widthMm * depthMm * areaFactor;
  const topVolumeMm3 = topAreaMm2 * topThicknessMm;

  // Base/legs: rough placeholder — 4 cylindrical/box legs scaled by height.
  const legCrossSectionMm2 = 60 * 60;
  const legVolumeMm3 = legCrossSectionMm2 * heightMm * 4;

  const totalMm3 = topVolumeMm3 + legVolumeMm3;
  return totalMm3 / 1_000_000; // mm^3 -> liters (1 L = 1,000,000 mm^3)
}

export function estimateMetrics(
  params: TableParams,
  constraints: ProductionConstraints,
): EstimatedMetrics {
  const material =
    constraints.materials.find((m) => m.id === params.materialId) ?? constraints.materials[0];
  const wallThicknessMm = constraints.structure.defaultWallThicknessMm;

  const volumeLiters = approximateVolumeLiters(params, wallThicknessMm);
  const printTimeHours =
    volumeLiters * constraints.estimation.baseHoursPerLiter * material.printSpeedFactor;
  const weightKg = volumeLiters * (material.densityKgPerM3 / 1000);

  return {
    estimatedPrintTimeHours: Math.round(printTimeHours * 10) / 10,
    estimatedMaterialWeightKg: Math.round(weightKg * 10) / 10,
    estimatedVolumeLiters: Math.round(volumeLiters * 10) / 10,
    isPlaceholderEstimate: true,
  };
}

/**
 * The manufacturability validation engine. Reads ALL limits from the
 * `constraints` argument (sourced from config/production-constraints.json)
 * — never a hard-coded number — and returns structured errors/warnings plus
 * placeholder-but-clearly-labeled estimated metrics.
 */
export function validateTableDesign(
  params: TableParams,
  constraints: ProductionConstraints,
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const { dimensions } = constraints;

  const dimensionChecks: Array<{
    field: keyof TableParams;
    label: string;
    value: number;
    limit: { min: number; max: number };
  }> = [
    { field: "widthMm", label: "Width", value: params.widthMm, limit: dimensions.width },
    { field: "depthMm", label: "Depth", value: params.depthMm, limit: dimensions.depth },
    { field: "heightMm", label: "Height", value: params.heightMm, limit: dimensions.height },
  ];

  for (const check of dimensionChecks) {
    if (check.value < check.limit.min) {
      issues.push({
        code: `${check.field}_below_min`,
        field: check.field,
        severity: "error",
        message: `${check.label} (${check.value}mm) is below the minimum manufacturable ${check.label.toLowerCase()} of ${check.limit.min}mm.`,
      });
    } else if (check.value > check.limit.max) {
      issues.push({
        code: `${check.field}_above_max`,
        field: check.field,
        severity: "error",
        message: `${check.label} (${check.value}mm) exceeds the maximum manufacturable ${check.label.toLowerCase()} of ${check.limit.max}mm.`,
      });
    } else {
      const range = check.limit.max - check.limit.min;
      const nearTop = check.value > check.limit.max - range * 0.05;
      const nearBottom = check.value < check.limit.min + range * 0.05;
      if (nearTop || nearBottom) {
        issues.push({
          code: `${check.field}_near_limit`,
          field: check.field,
          severity: "warning",
          message: `${check.label} (${check.value}mm) is close to the manufacturable limit. Production tolerances may apply.`,
        });
      }
    }
  }

  // Cross-parameter placeholder rule: very tall + very wide tops on a
  // pedestal base warrant a stability warning. Purely illustrative.
  if (
    params.baseStyle === "pedestal" &&
    params.widthMm > dimensions.width.min + (dimensions.width.max - dimensions.width.min) * 0.7
  ) {
    issues.push({
      code: "pedestal_wide_top_warning",
      field: "baseStyle",
      severity: "warning",
      message:
        "A single pedestal base with a wide tabletop may need extra reinforcement. Consider the four-leg or trestle base for tops this large.",
    });
  }

  const material = constraints.materials.find((m) => m.id === params.materialId);
  if (!material) {
    issues.push({
      code: "material_unknown",
      field: "materialId",
      severity: "error",
      message: "Selected material is not in the current production material list.",
    });
  }

  const finish = constraints.finishes.find((f) => f.id === params.finishId);
  if (!finish) {
    issues.push({
      code: "finish_unknown",
      field: "finishId",
      severity: "error",
      message: "Selected finish is not in the current production finish list.",
    });
  }

  const valid = !issues.some((i) => i.severity === "error");

  return {
    valid,
    issues,
    estimate: estimateMetrics(params, constraints),
    constraintsRevision: constraints.revision,
  };
}
