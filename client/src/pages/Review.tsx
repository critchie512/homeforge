import { useMemo } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TopNav } from "@/components/TopNav";
import { ValidationPanel } from "@/components/ValidationPanel";
import { TablePreview } from "@/components/TablePreview";
import { QualificationSticker } from "@/components/QualificationSticker";
import { getFinishPreviewColor } from "@/lib/finishColors";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, ArrowRight } from "lucide-react";
import type { DesignVersion, Project } from "@shared/schema";
import type { TableParams, ValidationResult } from "@shared/tableDesign";

export default function Review() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const projectId = Number(projectIdParam);

  const projectQuery = useQuery<Project>({ queryKey: ["/api/projects", String(projectId)] });
  const latestVersionQuery = useQuery<DesignVersion>({
    queryKey: ["/api/projects", String(projectId), "design-versions", "latest"],
    retry: false,
  });

  const version = latestVersionQuery.data;
  const params = version?.params as TableParams | undefined;
  const validation = version?.validation as ValidationResult | undefined;

  const digitalTwinId = useMemo(() => {
    if (!version) return null;
    // Deterministic placeholder identifier shown pre-order — the real,
    // persistent DigitalTwin record is created once an Order exists.
    return `HF-PREVIEW-${String(projectId).padStart(4, "0")}-V${version.version}`;
  }, [projectId, version]);

  if (latestVersionQuery.isLoading) {
    return (
      <div className="min-h-screen">
        <TopNav projectId={projectId} />
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          <div className="skeleton skeleton-heading" />
          <div className="mt-4 skeleton skeleton-image" />
        </main>
      </div>
    );
  }

  if (!version || !params) {
    return (
      <div className="min-h-screen">
        <TopNav projectId={projectId} />
        <main className="mx-auto max-w-6xl px-4 py-16 text-center md:px-8">
          <h1 className="font-display text-xl font-semibold">No saved design yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Save a design version in Configure before reviewing your table.
          </p>
          <Button asChild className="mt-6" data-testid="button-go-configure">
            <Link href={`/configure/${projectId}`}>Go to Configure</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopNav projectId={projectId} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-semibold" data-testid="text-page-title">
              Review — {projectQuery.data?.name ?? "your table"}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Lock className="h-3.5 w-3.5" />
              Version {version.version} — locked, immutable
            </p>
          </div>
          <Badge
            variant={validation?.valid ? "default" : "destructive"}
            data-testid="badge-design-status"
          >
            {validation?.valid ? "Valid design" : "Invalid design"}
          </Badge>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_360px]">
          <section className="space-y-6">
            <div className="aspect-[4/3] overflow-hidden rounded-xl border border-card-border bg-black">
              <TablePreview params={params} finishColor={getFinishPreviewColor(params.finishId)} />
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-sm font-medium text-muted-foreground">Design digital twin record</h2>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <DigitalTwinField label="Twin ID (preview)" value={digitalTwinId ?? "—"} />
                <DigitalTwinField label="Design version" value={`v${version.version}`} />
                <DigitalTwinField
                  label="Status"
                  value={validation?.valid ? "Ready to order" : "Blocked — invalid design"}
                />
              </dl>
              <p className="mt-3 text-xs text-muted-foreground" data-testid="text-twin-note">
                The permanent digital twin (with a physical identifier) is created once you place
                an order — it links this design version to the order, production history, and
                qualification record.
              </p>
            </div>

            <div className="flex justify-end">
              <Button
                asChild
                disabled={!validation?.valid}
                data-testid="button-go-checkout"
              >
                <Link href={validation?.valid ? `/checkout/${projectId}` : "#"}>
                  Continue to Checkout <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>

          <aside className="space-y-6">
            <div>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">Manufacturability</h2>
              <ValidationPanel result={validation} />
            </div>

            <div>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">
                Pre-ship qualification (preview)
              </h2>
              <QualificationSticker
                physicalId={digitalTwinId ?? "PENDING"}
                qualified={false}
                statusLabel="Not yet produced"
              />
              <p className="mt-2 text-xs text-muted-foreground" data-testid="text-sticker-disclaimer">
                Mocked preview — the real sticker is generated after production and qualification.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function DigitalTwinField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium" data-testid={`text-twin-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        {value}
      </dd>
    </div>
  );
}
