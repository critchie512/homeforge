import { Check } from "lucide-react";

export interface StepDef {
  key: string;
  label: string;
  description: string;
}

interface StepSidebarProps {
  steps: StepDef[];
  activeIndex: number;
  completedIndexes: Set<number>;
  onStepClick: (index: number) => void;
}

export function StepSidebar({ steps, activeIndex, completedIndexes, onStepClick }: StepSidebarProps) {
  return (
    <nav aria-label="Configuration steps" className="flex flex-row gap-2 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isDone = completedIndexes.has(index);
        const isReachable = isDone || index === activeIndex || completedIndexes.has(index - 1);

        return (
          <button
            key={step.key}
            type="button"
            onClick={() => isReachable && onStepClick(index)}
            disabled={!isReachable}
            data-testid={`button-step-${step.key}`}
            aria-current={isActive ? "step" : undefined}
            className={`hover-elevate flex shrink-0 items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors md:shrink md:w-full ${
              isActive ? "bg-accent" : ""
            } ${!isReachable ? "opacity-40 cursor-not-allowed" : ""}`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : isDone
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground"
              }`}
            >
              {isDone && !isActive ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <span className="min-w-0">
              <span
                className={`block text-sm font-medium ${isActive ? "text-foreground" : "text-foreground/90"}`}
              >
                {step.label}
              </span>
              <span className="hidden text-xs text-muted-foreground md:block">{step.description}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
