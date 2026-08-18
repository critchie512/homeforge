import { AlertTriangle, CheckCircle2, Clock, Weight, Box } from "lucide-react";
import type { ValidationResult } from "@shared/tableDesign";

interface ValidationPanelProps {
  result: ValidationResult | undefined;
  isLoading?: boolean;
}

export function ValidationPanel({ result, isLoading }: ValidationPanelProps) {
  if (isLoading || !result) {
    return (
      <div className="rounded-lg border border-card-border bg-card p-4" data-testid="panel-validation-loading">
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text" />
      </div>
    );
  }

  const errors = result.issues.filter((i) => i.severity === "error");
  const warnings = result.issues.filter((i) => i.severity === "warning");

  return (
    <div className="space-y-4" data-testid="panel-validation">
      <div
        className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 ${
          result.valid
            ? "border-primary/30 bg-primary/10 text-primary"
            : "border-destructive/30 bg-destructive/10 text-destructive"
        }`}
        data-testid="status-manufacturability"
      >
        {result.valid ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
        <span className="text-sm font-medium">
          {result.valid ? "Design is manufacturable" : "Design needs changes before it can be ordered"}
        </span>
      </div>

      {errors.length > 0 && (
        <ul className="space-y-2" data-testid="list-validation-errors">
          {errors.map((issue) => (
            <li
              key={issue.code}
              className="rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              data-testid={`text-error-${issue.code}`}
            >
              {issue.message}
            </li>
          ))}
        </ul>
      )}

      {warnings.length > 0 && (
        <ul className="space-y-2" data-testid="list-validation-warnings">
          {warnings.map((issue) => (
            <li
              key={issue.code}
              className="rounded-md border border-chart-2/30 bg-chart-2/10 px-3 py-2 text-sm text-foreground/90"
              data-testid={`text-warning-${issue.code}`}
            >
              {issue.message}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-card-border bg-card p-3" data-testid="metric-print-time">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Est. print time
          </div>
          <div className="mt-1 text-lg font-semibold">{result.estimate.estimatedPrintTimeHours}h</div>
        </div>
        <div className="rounded-lg border border-card-border bg-card p-3" data-testid="metric-weight">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Weight className="h-3.5 w-3.5" />
            Est. weight
          </div>
          <div className="mt-1 text-lg font-semibold">{result.estimate.estimatedMaterialWeightKg} kg</div>
        </div>
      </div>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="text-estimate-disclaimer">
        <Box className="h-3 w-3" />
        Placeholder estimate (constraints rev. {result.constraintsRevision}) — pending real printer
        specs, not a manufacturing guarantee.
      </p>
    </div>
  );
}
