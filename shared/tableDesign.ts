// ---------------------------------------------------------------------------
// NestForge Studio — single source of truth for the coffee table parameter
// object.
//
// Rebuilt to match the real product mockups the owner provided (pre-ship
// qualification sticker, build-instruction reference sheet, app home-screen
// mockup): the product is NOT a fully custom-dimensioned 3D-printed table.
// It's a curated base table (e.g. an IKEA LACK) with a 3-D printed center
// section (three interlocking tiles, a decorative pattern) and laminate end
// panels. Customers therefore pick from catalogs (base table, center design,
// laminate finish, print material) instead of setting raw numeric
// dimensions — which also satisfies the "don't let customers create
// impossible geometry" principle by construction, since every option in a
// catalog is pre-vetted.
//
// Both the interactive 3D preview (client/src/components/TablePreview.tsx)
// and the manufacturability validation engine (validateTableDesign below)
// consume the exact same TableParams shape and the exact same constraints
// file (config/production-constraints.json). Nothing about geometry or
// limits should ever be duplicated or hard-coded elsewhere.
// ---------------------------------------------------------------------------

export interface TableParams {
  // Customer picks a curated base table (see ProductionConstraints.baseTables)
  // rather than setting width/depth/height independently. widthMm/depthMm/
  // heightMm/centerSectionWidthMm are always kept in sync with the selected
  // baseTableId via applyBaseTable() below, and remain the values the 3D
  // preview and validateTableDesign() actually consume — so nothing
  // downstream needs to change to support the base-table catalog.
  baseTableId: string;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  centerSectionWidthMm: number;

  // Customer picks a center-tile design from the catalog (browse/remix), or
  // sets isCustomDesign to mark "Create your own" — a from-scratch design
  // intent that isn't a generative tool in this build, just a flag routed
  // to manual design review before production.
  centerDesignId: string;
  isCustomDesign: boolean;

  materialId: string;
  laminateFinishId: string;
}

export const DEFAULT_TABLE_PARAMS: TableParams = {
  baseTableId: "ikea-lack-black-brown",
  widthMm: 1200,
  depthMm: 780,
  heightMm: 450,
  centerSectionWidthMm: 720,
  centerDesignId: "flowing-waves",
  isCustomDesign: false,
  materialId: "pla-matte",
  laminateFinishId: "warm-oak",
};

export interface BaseTable {
  id: string;
  label: string;
  vendor: string;
  priceUsd: number;
  widthMm: number;
  depthMm: number;
  heightMm: number;
  centerSectionWidthMm: number;
  productUrl: string | null;
  confirmed: boolean;
}

export interface CenterDesign {
  id: string;
  label: string;
  description: string;
  confirmed: boolean;
}

/** Apply a base table selection, syncing baseTableId with the derived
 * dimension fields that TablePreview and validateTableDesign() read. */
export function applyBaseTable(
  table: BaseTable,
): Pick<TableParams, "baseTableId" | "widthMm" | "depthMm" | "heightMm" | "centerSectionWidthMm"> {
  return {
    baseTableId: table.id,
    widthMm: table.widthMm,
    depthMm: table.depthMm,
    heightMm: table.heightMm,
    centerSectionWidthMm: table.centerSectionWidthMm,
  };
}

// --- Production constraints -------------------------------------------------
// Shape mirrors config/production-constraints.json exactly. Loaded from disk
// on the server; bundled at build time on the client (see
// client/src/lib/productionConstraints.ts) — both read the SAME json file,
// never a hard-coded duplicate.

export interface ProductionConstraints {
  revision: string;
  units: Record<string, string>;
  printer: {
    id: string;
    label: string;
    buildVolumeMm: { width: number; depth: number; height: number };
  };
  budget: { targetTotalUsd: number };
  baseTables: BaseTable[];
  centerDesigns: CenterDesign[];
  materials: Array<{
    id: string;
    label: string;
    densityKgPerM3: number;
    printSpeedFactor: number;
  }>;
  laminateFinishes: Array<{ id: string; label: string }>;
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
 * Approximate solid volume of ONLY the 3-D printed center tiles (the base
 * table and laminate end panels are not printed), used only to derive
 * PLACEHOLDER estimated print time / weight. This is intentionally a rough
 * slab approximation, not real slicer output.
 */
function approximateCenterVolumeLiters(params: TableParams): number {
  const topThicknessMm = 18; // placeholder tile thickness
  const centerAreaMm2 = params.centerSectionWidthMm * params.depthMm;
  const centerVolumeMm3 = centerAreaMm2 * topThicknessMm;
  return centerVolumeMm3 / 1_000_000; // mm^3 -> liters (1 L = 1,000,000 mm^3)
}

export function estimateMetrics(
  params: TableParams,
  constraints: ProductionConstraints,
): EstimatedMetrics {
  const material =
    constraints.materials.find((m) => m.id === params.materialId) ?? constraints.materials[0];

  const volumeLiters = approximateCenterVolumeLiters(params);
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
 * The manufacturability validation engine. Since customers now choose from
 * pre-vetted catalogs (base table, center design, material, laminate
 * finish) instead of typing raw dimensions, most of the "impossible
 * geometry" risk is eliminated by construction. What's left to validate:
 *
 *   1. Every selected catalog id still exists / is available.
 *   2. The selected base table's derived center-tile geometry still fits
 *      the printer's build volume (a real protective check on the catalog
 *      DATA, not customer input — catches a bad base-table entry before it
 *      reaches production).
 *
 * Reads ALL limits from the `constraints` argument (sourced from
 * config/production-constraints.json) — never a hard-coded number.
 */
export function validateTableDesign(
  params: TableParams,
  constraints: ProductionConstraints,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  const baseTable = constraints.baseTables.find((t) => t.id === params.baseTableId);
  if (!baseTable) {
    issues.push({
      code: "base_table_unknown",
      field: "baseTableId",
      severity: "error",
      message: "Selected base table is not in the current curated collection.",
    });
  } else {
    // Three center tiles, each printed as two interlocking half-tiles (per
    // the build-instruction mockup). Check the resulting half-tile width
    // against the printer's build volume — this is a check on the CATALOG
    // entry's geometry, not on anything the customer typed.
    const tileWidthMm = baseTable.centerSectionWidthMm / 3;
    const halfTileWidthMm = tileWidthMm / 2;
    const { buildVolumeMm } = constraints.printer;
    if (halfTileWidthMm > buildVolumeMm.width || baseTable.depthMm > buildVolumeMm.depth * 4) {
      issues.push({
        code: "center_tiles_exceed_build_volume",
        field: "baseTableId",
        severity: "error",
        message: `This base table's center-tile geometry doesn't fit the ${constraints.printer.label}'s build volume. This base table needs to be re-checked before it can stay in the curated collection.`,
      });
    }
  }

  if (!params.isCustomDesign) {
    const design = constraints.centerDesigns.find((d) => d.id === params.centerDesignId);
    if (!design) {
      issues.push({
        code: "center_design_unknown",
        field: "centerDesignId",
        severity: "error",
        message: "Selected center design is not in the current design gallery.",
      });
    }
  } else {
    issues.push({
      code: "custom_design_pending_review",
      field: "centerDesignId",
      severity: "warning",
      message:
        "A from-scratch design was requested. This requires manual design review before it can be sent to production.",
    });
  }

  const material = constraints.materials.find((m) => m.id === params.materialId);
  if (!material) {
    issues.push({
      code: "material_unknown",
      field: "materialId",
      severity: "error",
      message: "Selected print material is not in the current production material list.",
    });
  }

  const laminateFinish = constraints.laminateFinishes.find((f) => f.id === params.laminateFinishId);
  if (!laminateFinish) {
    issues.push({
      code: "laminate_finish_unknown",
      field: "laminateFinishId",
      severity: "error",
      message: "Selected laminate finish is not in the current production finish list.",
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
