import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/components/ThemeProvider";
import { Loader2, Ruler, Boxes, ShieldCheck, Moon, Sun, ArrowRight } from "lucide-react";
import type { Project } from "@shared/schema";

/**
 * HomeForge home page.
 *
 * Structure (before/after transformation visual, full site explanation, and
 * primary nav) was requested directly by the product owner. The original
 * ChatGPT-authored handoff document does not specify a home page or exact
 * visuals for one — this layout, copy, and the before/after artwork are a
 * flagged implementation choice, built to be easy to swap once real product
 * photography / exact marketing direction exists. See docs/DECISIONS.md.
 */
export default function Landing() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");
  const { theme, toggleTheme } = useTheme();

  const createProject = useMutation({
    mutationFn: async (projectName: string) => {
      const res = await apiRequest("POST", "/api/projects", { name: projectName, status: "draft" });
      return (await res.json()) as Project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      navigate(`/configure/${project.id}`);
    },
  });

  const handleStart = () => {
    const projectName = name.trim() || "My Coffee Table";
    createProject.mutate(projectName);
  };

  return (
    <div className="min-h-screen" id="top">
      <HomeNav theme={theme} toggleTheme={toggleTheme} />

      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <main className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
        <section className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <div className="mb-6 text-primary">
              <Logo size={40} />
            </div>
            <h1
              className="font-display text-2xl font-semibold leading-tight md:text-3xl"
              data-testid="text-headline"
            >
              A made-to-order coffee table, printed for your space.
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground">
              Pick a supported size, a top shape, a base style, and a finish. HomeForge shows you
              the real design in 3D and checks it against production limits before it ever reaches
              the shop floor — every table gets a digital twin and a pre-shipment quality check.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name your project (optional)"
                aria-label="Project name"
                data-testid="input-project-name"
                className="sm:max-w-xs"
                onKeyDown={(e) => e.key === "Enter" && handleStart()}
              />
              <Button
                onClick={handleStart}
                disabled={createProject.isPending}
                data-testid="button-start-project"
                size="lg"
              >
                {createProject.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Start your table"
                )}
              </Button>
            </div>
            {createProject.isError && (
              <p className="mt-3 text-sm text-destructive" data-testid="text-start-error">
                Couldn't start a new project. Please try again.
              </p>
            )}

            <dl className="mt-12 grid gap-6 sm:grid-cols-3">
              <div>
                <Ruler className="h-4 w-4 text-primary" />
                <dt className="mt-2 text-sm font-medium">Supported sizes only</dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  Every size is pre-approved against real production limits — no guesswork.
                </dd>
              </div>
              <div>
                <Boxes className="h-4 w-4 text-primary" />
                <dt className="mt-2 text-sm font-medium">One source of truth</dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  The 3D preview and the manufacturing check use the same parameters — always.
                </dd>
              </div>
              <div>
                <ShieldCheck className="h-4 w-4 text-primary" />
                <dt className="mt-2 text-sm font-medium">Every table, verified</dt>
                <dd className="mt-1 text-xs text-muted-foreground">
                  Each order gets a digital twin and a pre-shipment quality check.
                </dd>
              </div>
            </dl>
          </div>

          <div className="aspect-square rounded-xl border border-card-border bg-card p-8">
            <LandingPreviewGraphic />
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Before / After transformation                                 */}
        {/* ------------------------------------------------------------ */}
        <section id="transformation" className="mt-24 md:mt-32">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-xl font-semibold md:text-2xl" data-testid="text-transformation-title">
              An empty corner, transformed.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">
              You tell us the size and style. We handle the design, the manufacturability check,
              and the print — and hand you back a table built for that exact spot.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <BeforeAfterPanel variant="before" />
            <div className="flex items-center justify-center text-primary">
              <ArrowRight className="hidden h-6 w-6 sm:block" aria-hidden="true" />
              <ArrowRight className="h-6 w-6 rotate-90 sm:hidden" aria-hidden="true" />
            </div>
            <BeforeAfterPanel variant="after" />
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* How it works                                                  */}
        {/* ------------------------------------------------------------ */}
        <section id="how-it-works" className="mt-24 md:mt-32">
          <h2 className="font-display text-xl font-semibold md:text-2xl" data-testid="text-how-it-works-title">
            How HomeForge works
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            One guided flow from first idea to a table on your floor. Every step reads and writes
            the same design, so nothing gets lost in translation.
          </p>

          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <HowItWorksStep
              index={1}
              title="Configure"
              description="Choose a supported size, top shape, base style, material, and finish. The 3D preview updates live."
            />
            <HowItWorksStep
              index={2}
              title="Review"
              description="Lock in an immutable design version and see the manufacturability check pass before you order."
            />
            <HowItWorksStep
              index={3}
              title="Checkout"
              description="Place your order. A digital twin is created the moment it's confirmed."
            />
            <HowItWorksStep
              index={4}
              title="Track"
              description="Follow production status and the pre-shipment qualification check for your exact table."
            />
          </ol>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Sizes & materials                                             */}
        {/* ------------------------------------------------------------ */}
        <section id="sizes" className="mt-24 md:mt-32">
          <h2 className="font-display text-xl font-semibold md:text-2xl" data-testid="text-sizes-title">
            Supported sizes, real materials
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground md:text-base">
            No free-form dimensions to second-guess. Every HomeForge table ships in one of three
            supported sizes — Compact, Standard, or Large — each one pre-approved against our
            production limits, in the material and finish you choose.
          </p>
          <div className="mt-8">
            <Button
              variant="outline"
              onClick={handleStart}
              disabled={createProject.isPending}
              data-testid="button-see-sizes"
            >
              See supported sizes <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Roadmap                                                       */}
        {/* ------------------------------------------------------------ */}
        <section id="roadmap" className="mt-24 mb-8 md:mt-32">
          <div className="rounded-xl border border-dashed border-card-border bg-card/50 p-6 md:p-8">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
              Coming soon
            </span>
            <h2 className="mt-3 font-display text-lg font-semibold md:text-xl" data-testid="text-roadmap-title">
              A catalog of supported tables from trusted suppliers
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Beyond fully custom designs, we're planning a browsable catalog of pre-approved
              coffee tables sourced from selected suppliers — so you can pick a proven design
              outright, or use it as a starting point for your own configuration. This is an early
              roadmap idea, not yet built or scheduled.
            </p>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}

function HomeNav({ theme, toggleTheme }: { theme: "light" | "dark"; toggleTheme: () => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        <a
          href="#top"
          className="flex items-center gap-2.5 text-foreground hover-elevate rounded-md px-2 py-1.5 -ml-2"
          data-testid="link-home-logo"
        >
          <Logo size={26} className="text-primary" />
          <span className="font-display text-sm font-semibold tracking-wide">HomeForge</span>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          <a
            href="#how-it-works"
            className="hover-elevate rounded-md px-4 py-2 text-sm font-medium text-muted-foreground"
            data-testid="link-nav-how-it-works"
          >
            How it works
          </a>
          <a
            href="#sizes"
            className="hover-elevate rounded-md px-4 py-2 text-sm font-medium text-muted-foreground"
            data-testid="link-nav-sizes"
          >
            Sizes & materials
          </a>
          <a
            href="#roadmap"
            className="hover-elevate rounded-md px-4 py-2 text-sm font-medium text-muted-foreground"
            data-testid="link-nav-roadmap"
          >
            Roadmap
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            data-testid="button-theme-toggle"
            className="hover-elevate rounded-md p-2 text-muted-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
}

function HomeFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-8 text-center text-xs text-muted-foreground md:px-8">
        <div className="flex items-center gap-2 text-foreground">
          <Logo size={18} className="text-primary" />
          <span className="font-display font-semibold">HomeForge</span>
        </div>
        <p>Made-to-order, manufacturable-by-design coffee tables.</p>
      </div>
    </footer>
  );
}

function HowItWorksStep({
  index,
  title,
  description,
}: {
  index: number;
  title: string;
  description: string;
}) {
  return (
    <li className="rounded-xl border border-card-border bg-card p-5" data-testid={`item-how-it-works-${index}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {index}
      </span>
      <h3 className="mt-4 text-sm font-medium">{title}</h3>
      <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
    </li>
  );
}

/** Small illustrative graphic shown in the hero card. Not the before/after
 * comparison — see BeforeAfterPanel below for that. */
function LandingPreviewGraphic() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <svg
        viewBox="0 0 200 140"
        className="h-40 w-full text-primary"
        aria-hidden="true"
        fill="none"
      >
        <rect x="20" y="40" width="160" height="16" rx="3" fill="currentColor" opacity="0.9" />
        <path d="M40 56L28 116H44L54 56H40Z" fill="currentColor" opacity="0.75" />
        <path d="M160 56L172 116H156L146 56H160Z" fill="currentColor" opacity="0.75" />
        <path d="M96 56L100 70L104 56H96Z" fill="currentColor" />
      </svg>
      <p className="text-xs text-muted-foreground" data-testid="text-preview-hint">
        Your live 3D preview appears once you start configuring.
      </p>
    </div>
  );
}

/**
 * Before/after room-corner illustration. Custom flat-geometric SVG art in the
 * HomeForge palette (not a photo) — an intentional, flagged placeholder for
 * real lifestyle photography. "Before" shows an empty corner; "after" adds
 * the HomeForge table, a rug, and a plant.
 */
function BeforeAfterPanel({ variant }: { variant: "before" | "after" }) {
  const isAfter = variant === "after";
  return (
    <div
      className="overflow-hidden rounded-xl border border-card-border bg-card"
      data-testid={`panel-${variant}`}
    >
      <div className="flex items-center justify-between border-b border-card-border px-4 py-2.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {isAfter ? "After" : "Before"}
        </span>
        {isAfter && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
            HomeForge
          </span>
        )}
      </div>
      <svg viewBox="0 0 320 220" className="h-56 w-full sm:h-64" aria-hidden="true">
        {/* Room shell */}
        <rect x="0" y="0" width="320" height="220" className="fill-background" />
        <rect x="0" y="0" width="320" height="150" className="fill-card" />
        <rect x="0" y="150" width="320" height="70" className="fill-secondary" />
        <rect x="0" y="148" width="320" height="4" className="fill-border" />
        {/* Window */}
        <rect x="30" y="30" width="70" height="90" rx="2" className="fill-background stroke-border" strokeWidth="2" />
        <line x1="65" y1="30" x2="65" y2="120" className="stroke-border" strokeWidth="2" />
        <line x1="30" y1="75" x2="100" y2="75" className="stroke-border" strokeWidth="2" />

        {isAfter && (
          <>
            {/* Rug */}
            <ellipse cx="190" cy="188" rx="95" ry="20" className="fill-background opacity-60" />
            {/* Plant */}
            <rect x="266" y="150" width="20" height="26" rx="2" className="fill-border" />
            <circle cx="276" cy="138" r="16" fill="currentColor" className="text-primary" opacity="0.35" />
            <circle cx="266" cy="130" r="12" fill="currentColor" className="text-primary" opacity="0.35" />
            <circle cx="286" cy="130" r="12" fill="currentColor" className="text-primary" opacity="0.35" />
          </>
        )}

        {/* Coffee table (HomeForge logomark, scaled) — only in "after" */}
        {isAfter ? (
          <g transform="translate(120, 118) scale(2.6)" className="text-primary" fill="currentColor">
            <rect x="3" y="7" width="26" height="5" rx="1.5" />
            <path d="M8 12L5 26H9L11.5 12H8Z" />
            <path d="M24 12L27 26H23L20.5 12H24Z" />
            <path d="M14.5 12L16 16.5L17.5 12H14.5Z" />
          </g>
        ) : (
          <text
            x="160"
            y="190"
            textAnchor="middle"
            className="fill-muted-foreground"
            style={{ fontSize: "11px" }}
          >
            Just an empty corner
          </text>
        )}
      </svg>
    </div>
  );
}
