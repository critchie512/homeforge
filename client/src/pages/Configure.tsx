import { useMemo, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TopNav } from "@/components/TopNav";
import { StepSidebar, type StepDef } from "@/components/StepSidebar";
import { TablePreview } from "@/components/TablePreview";
import { ValidationPanel } from "@/components/ValidationPanel";
import { getFinishPreviewColor } from "@/lib/finishColors";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import {
  DEFAULT_TABLE_PARAMS,
  TOP_SHAPES,
  BASE_STYLES,
  applySizePreset,
  validateTableDesign,
  type TableParams,
  type ProductionConstraints,
  type SizePreset,
  type ValidationResult,
} from "@shared/tableDesign";
import type { DesignVersion, Project } from "@shared/schema";

const STEPS: StepDef[] = [
  { key: "dimensions", label: "Size", description: "Choose a supported size" },
  { key: "top", label: "Top", description: "Shape of the tabletop" },
  { key: "base", label: "Base", description: "Legs or pedestal style" },
  { key: "material", label: "Material / Color", description: "Print material & finish" },
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

  const finishColor = getFinishPreviewColor(params.finishId);
  const sizePresets = constraintsQuery.data?.sizePresets;

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
              <TablePreview params={params} finishColor={finishColor} />
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6">
              {stepIndex === 0 && sizePresets && (
                <SizeStep params={params} presets={sizePresets} onChange={update} />
              )}
              {stepIndex === 1 && <TopStep params={params} onChange={update} />}
              {stepIndex === 2 && <BaseStep params={params} onChange={update} />}
              {stepIndex === 3 && constraintsQuery.data && (
                <MaterialStep params={params} constraints={constraintsQuery.data} onChange={update} />
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

function SizeStep({
  params,
  presets,
  onChange,
}: {
  params: TableParams;
  presets: SizePreset[];
  onChange: (patch: Partial<TableParams>) => void;
}) {
  return (
    <div>
      <Label className="mb-1 block">Size</Label>
      <p className="mb-4 text-xs text-muted-foreground">
        Every HomeForge table ships in one of these supported sizes — each one is pre-approved
        against our production limits, so there's nothing to second-guess.
      </p>
      <RadioGroup
        value={params.sizePresetId}
        onValueChange={(id) => {
          const preset = presets.find((p) => p.id === id);
          if (preset) onChange(applySizePreset(preset));
        }}
        className="grid gap-3 sm:grid-cols-3"
      >
        {presets.map((preset) => (
          <label
            key={preset.id}
            className={`hover-elevate flex cursor-pointer flex-col gap-2 rounded-lg border p-4 ${
              params.sizePresetId === preset.id ? "border-primary" : "border-card-border"
            }`}
            data-testid={`option-size-${preset.id}`}
          >
            <RadioGroupItem value={preset.id} className="sr-only" />
            <span className="text-sm font-medium">{preset.label}</span>
            <span className="text-xs text-muted-foreground">{preset.description}</span>
            <span className="mt-1 text-xs font-medium tabular-nums text-primary">
              {preset.widthMm} × {preset.depthMm} × {preset.heightMm} mm
            </span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

function TopStep({
  params,
  onChange,
}: {
  params: TableParams;
  onChange: (patch: Partial<TableParams>) => void;
}) {
  const labels: Record<string, string> = { rectangle: "Rectangle", round: "Round", oval: "Oval" };
  return (
    <div>
      <Label className="mb-3 block">Top shape</Label>
      <RadioGroup
        value={params.topShape}
        onValueChange={(v) => onChange({ topShape: v as TableParams["topShape"] })}
        className="grid grid-cols-3 gap-3"
      >
        {TOP_SHAPES.map((shape) => (
          <label
            key={shape}
            className={`hover-elevate flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 ${
              params.topShape === shape ? "border-primary" : "border-card-border"
            }`}
            data-testid={`option-top-${shape}`}
          >
            <RadioGroupItem value={shape} className="sr-only" />
            <ShapeGlyph shape={shape} />
            <span className="text-sm">{labels[shape]}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}

function ShapeGlyph({ shape }: { shape: string }) {
  if (shape === "round") {
    return <div className="h-10 w-10 rounded-full border-2 border-current" aria-hidden="true" />;
  }
  if (shape === "oval") {
    return <div className="h-8 w-12 rounded-full border-2 border-current" aria-hidden="true" />;
  }
  return <div className="h-8 w-12 rounded-sm border-2 border-current" aria-hidden="true" />;
}

function BaseStep({
  params,
  onChange,
}: {
  params: TableParams;
  onChange: (patch: Partial<TableParams>) => void;
}) {
  const labels: Record<string, string> = {
    pedestal: "Pedestal",
    "four-leg": "Four-leg",
    trestle: "Trestle",
  };
  const descriptions: Record<string, string> = {
    pedestal: "Single center column",
    "four-leg": "Classic four corner legs",
    trestle: "Two end panels with a stretcher",
  };
  return (
    <div>
      <Label className="mb-3 block">Base style</Label>
      <RadioGroup
        value={params.baseStyle}
        onValueChange={(v) => onChange({ baseStyle: v as TableParams["baseStyle"] })}
        className="grid gap-3 sm:grid-cols-3"
      >
        {BASE_STYLES.map((style) => (
          <label
            key={style}
            className={`hover-elevate flex cursor-pointer flex-col gap-1 rounded-lg border p-4 ${
              params.baseStyle === style ? "border-primary" : "border-card-border"
            }`}
            data-testid={`option-base-${style}`}
          >
            <RadioGroupItem value={style} className="sr-only" />
            <span className="text-sm font-medium">{labels[style]}</span>
            <span className="text-xs text-muted-foreground">{descriptions[style]}</span>
          </label>
        ))}
      </RadioGroup>
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
    <div className="space-y-6">
      <div>
        <Label className="mb-3 block">Print material</Label>
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

      <div>
        <Label className="mb-3 block">Finish / color</Label>
        <RadioGroup
          value={params.finishId}
          onValueChange={(v) => onChange({ finishId: v })}
          className="grid grid-cols-4 gap-3"
        >
          {constraints.finishes.map((f) => (
            <label
              key={f.id}
              className={`hover-elevate flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-3 ${
                params.finishId === f.id ? "border-primary" : "border-card-border"
              }`}
              data-testid={`option-finish-${f.id}`}
            >
              <RadioGroupItem value={f.id} className="sr-only" />
              <span
                className="h-8 w-8 rounded-full border border-border"
                style={{ backgroundColor: getFinishPreviewColor(f.id) }}
                aria-hidden="true"
              />
              <span className="text-xs">{f.label}</span>
            </label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}

const TOP_SHAPE_LABELS: Record<string, string> = {
  rectangle: "Rectangle",
  round: "Round",
  oval: "Oval",
};

const BASE_STYLE_LABELS: Record<string, string> = {
  pedestal: "Pedestal",
  "four-leg": "Four-leg",
  trestle: "Trestle",
};

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
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">Summary</h3>
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
        <SummaryItem
          label="Size"
          value={
            constraints?.sizePresets.find((p) => p.id === params.sizePresetId)?.label ??
            params.sizePresetId
          }
          plain
        />
        <SummaryItem label="Dimensions" value={`${params.widthMm} × ${params.depthMm} × ${params.heightMm} mm`} plain />
        <SummaryItem label="Top" value={TOP_SHAPE_LABELS[params.topShape] ?? params.topShape} plain />
        <SummaryItem label="Base" value={BASE_STYLE_LABELS[params.baseStyle] ?? params.baseStyle} plain />
        <SummaryItem
          label="Finish"
          value={
            constraints?.finishes.find((f) => f.id === params.finishId)?.label ?? params.finishId
          }
          plain
        />
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
