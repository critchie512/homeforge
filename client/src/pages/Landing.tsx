import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/Logo";
import { Loader2, Ruler, Boxes, ShieldCheck } from "lucide-react";
import type { Project } from "@shared/schema";

export default function Landing() {
  const [, navigate] = useLocation();
  const [name, setName] = useState("");

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
    <main className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
      <section className="grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          <div className="mb-6 text-primary">
            <Logo size={40} />
          </div>
          <h1 className="font-display text-xl font-semibold leading-tight md:text-xl" data-testid="text-headline">
            A made-to-order coffee table, built from your exact dimensions.
          </h1>
          <p className="mt-4 max-w-lg text-base text-muted-foreground">
            Set the width, depth, and height. Pick a top shape, base style, material, and finish.
            HomeForge previews the real design in 3D and checks it against production limits before
            it ever reaches the shop floor.
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
              <dt className="mt-2 text-sm font-medium">Built to your space</dt>
              <dd className="mt-1 text-xs text-muted-foreground">
                Dimensions checked against real production limits as you design.
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
    </main>
  );
}

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
