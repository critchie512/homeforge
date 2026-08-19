import { useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TopNav } from "@/components/TopNav";
import { StepSidebar, type StepDef } from "@/components/StepSidebar";
import { TablePreview } from "@/components/TablePreview";
import { ValidationPanel } from "@/components/ValidationPanel";
import { getLaminateFinishPreviewColor } from "@/lib/finishColors";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ChevronLeft, ChevronRight, Save, Sparkles, Waves } from "lucide-react";
import {
  DEFAULT_TABLE_PARAMS,
  applyBaseTable,
  validateTableDesign,
  type TableParams,
  type ProductionConstraints,
  type BaseTable,
  type CenterDesign,
  type ValidationResult,
} from "@shared/tableDesign";
import type { DesignVersion, Project } from "@shared/schema";

const STEPS: StepDef[] = [
  { key: "base-table", label: "Base Table", description: "Choose your curated base" },
  { key: "center-design", label: "Center Design", description: "Browse designs or create your own" },
  { key: "material", label: "Material", description: "Print material for the center" },
  { key: "laminate", label: "Laminate Finish", description: "Color for the end panels" },
  { key: "review", label: "Review", description: "Check & save this version" },
];

export default function Configure() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const [, navigate] = useLocation();
  const projectId = Number(projectIdParam);

  const [stepIndex, setStepIndex] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [params, setParams] = useState<TableParams>(DEFAULT_TABLE_PARAMS);

  const projectQuery = useQuery<Project>({ queryKey: ["/api/projects", String(projectId)] });
  const constraintsQuery = useQuery<ProductionConstraints>({
    queryKey: ["/api/config/production-constraints"],
  });
  const latestVersionQuery = useQuery<DesignVersion>({
    queryKey: ["/api/projects", String(projectId), "design-versions", "latest"],
    retry: false,
  });

  // Load the most recent immutable version's params as the editing starting
  // point, if one exists. Any change here will become version N+1 on save.
  useMemo(() => {
    if (latestVersionQuery.data?.params) {
      setParams(latestVersionQuery.data.params as TableParams);
    }
  }, [latestVersionQuery.data]);

  const validation: ValidationResult | undefined = useMemo(() => {
    if (!constraintsQuery.data) return undefined;
    return validateTableDesign(params, constraintsQuery.data);
  }, [params, constraintsQuery.data]);

  const saveVersion = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/design-versions`, { params });
      return (await res.json()) as DesignVersion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", String(projectId), "design-versions"] });
      navigate(`/review/${projectId}`);
    },
  });

  const update = (patch: Partial<TableParams>) => setParams((p) => ({ ...p, ...patch }));

  const goToStep = (index: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      for (let i = 0; i < index; i++) next.add(i);
      return next;
    });
    setStepIndex(index);
  };

  const goNext = () => {
    setCompleted((prev) => new Set(prev).add(stepIndex));
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const laminateColor = getLaminateFinishPreviewColor(params.laminateFinishId);

  return (
    <div className="min-h-screen">
      <TopNav projectId={projectId} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <h1 className="font-display text-xl font-semibold" data-testid="text-page-title">
          Configure — {projectQuery.data?.name ?? "your table"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every change updates the 3D preview and the manufacturability check together — they read
          the same parameters.
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-[220px_1fr_360px]">
          <aside className="min-w-0">
            <StepSidebar
              steps={STEPS}
              activeIndex={stepIndex}
              completedIndexes={completed}
              onStepClick={goToStep}
            />
          </aside>

          <section className="min-w-0 space-y-6">
            <div className="aspect-[4/3] overflow-hidden rounded-xl border border-card-border bg-black">
              <TablePreview params={params} laminateColor={laminateColor} />
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6">
              {stepIndex === 0 && constraintsQuery.data && (
                <BaseTableStep
                  params={params}
                  baseTables={constraintsQuery.data.baseTables}
                  onChange={update}
                />
              )}
              {stepIndex === 1 && constraintsQuery.data && (
                <CenterDesignStep
                  params={params}
                  designs={constraintsQuery.data.centerDesigns}
                  onChange={update}
                />
              )}
              {stepIndex === 2 && constraintsQuery.data && (
                <MaterialStep params={params} constraints={constraintsQuery.data} onChange={update} />
              )}
              {stepIndex === 3 && constraintsQuery.data && (
                <LaminateStep params={params} constraints={constraintsQuery.data} onChange={update} />
              )}
              {stepIndex === 4 && (
                <ReviewStep
                  params={params}
                  constraints={constraintsQuery.data}
                  validation={validation}
                  onSave={() => saveVersion.mutate()}
                  isSaving={saveVersion.isPending}
                />
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={goBack}
                disabled={stepIndex === 0}
                data-testid="button-step-back"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              {stepIndex < STEPS.length - 1 ? (
                <Button onClick={goNext} data-testid="button-step-next">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={() => saveVersion.mutate()}
                  disabled={saveVersion.isPending || !validation}
                  data-testid="button-save-version"
                >
                  {saveVersion.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4" /> Save this version
                    </>
                  )}
                </Button>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">Manufacturability</h2>
            <ValidationPanel result={validation} isLoading={constraintsQuery.isLoading} />
          </aside>
        </div>
      </main>
    </div>
  );
}

function BaseTableStep({
  params,
  baseTables,
  onChange,
}: {
  params: TableParams;
  baseTables: BaseTable[];
  onChange: (patch: Partial<TableParams>) => void;
}) {
  return (
    <div>
      <Label className="mb-1 block">Base table</Label>
      <p className="mb-4 text-xs text-muted-foreground">
        Every table starts from one of these curated base tables — each one is pre-approved
        against our production limits, so there's nothing to second-guess. Dimensions come from
        the base table you pick, not from typing numbers in.
      </p>
      <RadioGroup
        value={params.baseTableId}
        onValueChange={(id) => {
          const table = baseTables.find((t) => t.id === id);
          if (table) onChange(applyBaseTable(table));
        }}
        className="grid gap-3 sm:grid-cols-2"
      >
        {baseTables.map((table) => (
          <label
            key={table.id}
            className={`hover-elevate flex cursor-pointer flex-col gap-2 rounded-lg border p-4 ${
              params.baseTableId === table.id ? "border-primary" : "border-card-border"
            }`}
            data-testid={`option-base-table-${table.id}`}
          >
            <RadioGroupItem value={table.id} className="sr-only" />
            <span className="text-sm font-medium">{table.label}</span>
            <span className="text-xs text-muted-foreground">
              {table.vendor} · ${table.priceUsd.toFixed(2)}
            </span>
            <span className="mt-1 text-xs font-medium tabular-nums text-primary">
              {table.widthMm} × {table.depthMm} × {table.heightMm} mm
            </span>
            {!table.confirmed && (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Curated pick — coming soon
              </span>
            )}
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

function CenterDesignStep({
  params,
  designs,
  onChange,
}: {
  params: TableParams;
  designs: CenterDesign[];
  onChange: (patch: Partial<TableParams>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="mb-1 block">Center design</Label>
        <p className="mb-4 text-xs text-muted-foreground">
          Pick a design from the gallery, or start from a blank slate and we'll follow up to
          finalize a custom pattern with you.
        </p>
        <RadioGroup
          value={params.isCustomDesign ? "" : params.centerDesignId}
          onValueChange={(id) => onChange({ centerDesignId: id, isCustomDesign: false })}
          className="grid gap-3 sm:grid-cols-3"
        >
          {designs.map((design) => (
            <label
              key={design.id}
              className={`hover-elevate flex cursor-pointer flex-col gap-2 rounded-lg border p-4 ${
                !params.isCustomDesign && params.centerDesignId === design.id
                  ? "border-primary"
                  : "border-card-border"
              }`}
              data-testid={`option-center-design-${design.id}`}
            >
              <RadioGroupItem value={design.id} className="sr-only" />
              <Waves className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium">{design.label}</span>
              <span className="text-xs text-muted-foreground">{design.description}</span>
              {!design.confirmed && (
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Gallery pick — coming soon
                </span>
              )}
            </label>
          ))}
        </RadioGroup>
      </div>

      <button
        type="button"
        onClick={() => onChange({ isCustomDesign: true })}
        className={`hover-elevate flex w-full cursor-pointer items-center gap-3 rounded-lg border p-4 text-left ${
          params.isCustomDesign ? "border-primary" : "border-card-border"
        }`}
        data-testid="option-create-your-own"
      >
        <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
        <div>
          <span className="block text-sm font-medium">Create your own</span>
          <span className="block text-xs text-muted-foreground">
            Tell us your idea — we'll follow up to design a fully custom center pattern with you
            before production.
          </span>
        </div>
      </button>
    </div>
  );
}

function MaterialStep({
  params,
  constraints,
  onChange,
}: {
  params: TableParams;
  constraints: ProductionConstraints;
  onChange: (patch: Partial<TableParams>) => void;
}) {
  return (
    <div>
      <Label className="mb-3 block">Print material</Label>
      <p className="mb-4 text-xs text-muted-foreground">
        This is the material used for the 3-D printed center section only — the base table and
        laminate end panels are not printed.
      </p>
      <RadioGroup
        value={params.materialId}
        onValueChange={(v) => onChange({ materialId: v })}
        className="grid gap-3 sm:grid-cols-3"
      >
        {constraints.materials.map((m) => (
          <label
            key={m.id}
            className={`hover-elevate flex cursor-pointer flex-col gap-1 rounded-lg border p-4 ${
              params.materialId === m.id ? "border-primary" : "border-card-border"
            }`}
            data-testid={`option-material-${m.id}`}
          >
            <RadioGroupItem value={m.id} className="sr-only" />
            <span className="text-sm font-medium">{m.label}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

function LaminateStep({
  params,
  constraints,
  onChange,
}: {
  params: TableParams;
  constraints: ProductionConstraints;
  onChange: (patch: Partial<TableParams>) => void;
}) {
  return (
    <div>
      <Label className="mb-3 block">Laminate finish</Label>
      <p className="mb-4 text-xs text-muted-foreground">
        Applied to the two end panels that flank the printed center section.
      </p>
      <RadioGroup
        value={params.laminateFinishId}
        onValueChange={(v) => onChange({ laminateFinishId: v })}
        className="grid grid-cols-4 gap-3"
      >
        {constraints.laminateFinishes.map((f) => (
          <label
            key={f.id}
            className={`hover-elevate flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 ${
              params.laminateFinishId === f.id ? "border-primary" : "border-card-border"
            }`}
            data-testid={`option-laminate-${f.id}`}
          >
            <RadioGroupItem value={f.id} className="sr-only" />
            <span
              className="h-8 w-8 rounded-full border border-border"
              style={{ backgroundColor: getLaminateFinishPreviewColor(f.id) }}
              aria-hidden="true"
            />
            <span className="text-xs">{f.label}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

function ReviewStep({
  params,
  constraints,
  validation,
  onSave,
  isSaving,
}: {
  params: TableParams;
  constraints: ProductionConstraints | undefined;
  validation: ValidationResult | undefined;
  onSave: () => void;
  isSaving: boolean;
}) {
  const baseTable = constraints?.baseTables.find((t) => t.id === params.baseTableId);
  const centerDesign = constraints?.centerDesigns.find((d) => d.id === params.centerDesignId);
  const material = constraints?.materials.find((m) => m.id === params.materialId);
  const laminate = constraints?.laminateFinishes.find((f) => f.id === params.laminateFinishId);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Summary</h3>
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <SummaryItem label="Base table" value={baseTable?.label ?? params.baseTableId} plain />
        <SummaryItem
          label="Overall size"
          value={`${params.widthMm} × ${params.depthMm} × ${params.heightMm} mm`}
          plain
        />
        <SummaryItem
          label="Center design"
          value={params.isCustomDesign ? "Create your own (pending review)" : centerDesign?.label ?? params.centerDesignId}
          plain
        />
        <SummaryItem label="Material" value={material?.label ?? params.materialId} plain />
        <SummaryItem label="Laminate finish" value={laminate?.label ?? params.laminateFinishId} plain />
      </dl>
      <p className="text-xs text-muted-foreground">
        Saving creates a new, immutable design version. Once saved, this exact version can't be
        edited — changing anything later creates the next version.
      </p>
      {!validation?.valid && (
        <p className="text-sm text-destructive" data-testid="text-cannot-save">
          Resolve the errors shown in the manufacturability panel before saving.
        </p>
      )}
    </div>
  );
}

function SummaryItem({
  label,
  value,
  plain,
}: {
  label: string;
  value: string;
  plain?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd
        className={`mt-0.5 font-medium ${plain ? "" : "capitalize"}`}
        data-testid={`text-summary-${label.toLowerCase()}`}
      >
        {value}
      </dd>
    </div>
  );
}
