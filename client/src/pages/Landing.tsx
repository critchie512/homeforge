import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { BottomMobileNav } from "@/components/BottomMobileNav";
import { useTheme } from "@/components/ThemeProvider";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import {
  Loader2,
  Menu,
  ShoppingCart,
  ArrowRight,
  PenLine,
  Lightbulb,
  ChevronRight,
  Box,
  BadgeCheck,
  CalendarClock,
  Heart,
  Moon,
  Sun,
} from "lucide-react";
import type { Project } from "@shared/schema";

/**
 * NestForge Studio home page — rebuilt to match the real mobile app-home
 * mockup the product owner provided: top bar (hamburger / centered wordmark
 * + tagline / cart), a before-and-after transformation hero with a "SEE THE
 * TRANSFORMATION" CTA, an "Explore Designs" / "Create Your Own" card pair, a
 * "Choose a Table" banner into the curated base-table catalog, a four-icon
 * feature strip, and (on mobile) a fixed bottom tab bar. There's no cart or
 * saved-designs system in this build, so the cart icon and the bottom nav's
 * "Saved" / "Account" tabs are present for layout fidelity but don't carry
 * fake data — see docs/DECISIONS.md "Mockup reconciliation".
 */
export default function Landing() {
  const [, navigate] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const createProject = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/projects", {
        name: "My Coffee Table",
        status: "draft",
      });
      return (await res.json()) as Project;
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      navigate(`/configure/${project.id}`);
    },
  });

  const handleStart = () => createProject.mutate();

  return (
    <div className="min-h-screen pb-20 md:pb-0" id="top">
      <HomeTopBar
        theme={theme}
        toggleTheme={toggleTheme}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        onStart={handleStart}
      />

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
        {/* ------------------------------------------------------------ */}
        {/* Before / after transformation hero                            */}
        {/* ------------------------------------------------------------ */}
        <section
          id="transformation"
          className="relative overflow-hidden rounded-2xl border border-card-border"
          data-testid="section-hero-transformation"
        >
          <img
            src="/images/hero-before-after.jpg"
            alt="An ordinary black coffee table next to a NestForge table with a sculptural 3D-printed wave pattern center"
            className="h-[320px] w-full object-cover sm:h-[420px] md:h-[480px]"
          />

          <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            Before
          </span>
          <span className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
            After
          </span>

          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/80 bg-black/50 text-white backdrop-blur-sm">
              <ArrowRight className="h-5 w-5" />
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-5 pb-6 pt-16 text-center sm:px-10">
            <h1
              className="font-serif text-2xl font-semibold leading-tight text-white sm:text-3xl md:text-4xl"
              data-testid="text-headline"
            >
              From Ordinary to <span className="italic text-primary">Extraordinary</span>
            </h1>
            <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80 sm:text-xs">
              Custom 3D-printed surfaces. Timeless style.
            </p>
            <Button
              onClick={handleStart}
              disabled={createProject.isPending}
              size="lg"
              className="mt-5 uppercase tracking-wide"
              data-testid="button-see-transformation"
            >
              {createProject.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "See the transformation"
              )}
            </Button>
          </div>
        </section>
        {createProject.isError && (
          <p className="mt-3 text-center text-sm text-destructive" data-testid="text-start-error">
            Couldn't start a new design. Please try again.
          </p>
        )}

        {/* ------------------------------------------------------------ */}
        {/* Explore Designs / Create Your Own                             */}
        {/* ------------------------------------------------------------ */}
        <section className="mt-4 grid gap-4 sm:grid-cols-2" data-testid="section-explore-create">
          <PathCard
            image="/images/card-explore-designs.jpg"
            Icon={PenLine}
            title="Explore Designs"
            description="Browse stunning designs and remix to make it yours."
            cta="Get inspired"
            onClick={handleStart}
            disabled={createProject.isPending}
            testId="explore-designs"
          />
          <PathCard
            image="/images/card-create-your-own.jpg"
            Icon={Lightbulb}
            title="Create Your Own"
            description="Design from scratch with our creative studio."
            cta="Start designing"
            onClick={handleStart}
            disabled={createProject.isPending}
            testId="create-your-own"
          />
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Choose a table banner                                         */}
        {/* ------------------------------------------------------------ */}
        <section id="choose-table" className="mt-4" data-testid="section-choose-table">
          <button
            type="button"
            onClick={handleStart}
            disabled={createProject.isPending}
            className="hover-elevate flex w-full items-center justify-between gap-4 rounded-2xl border border-card-border bg-card p-5 text-left sm:p-6"
            data-testid="button-choose-table"
          >
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Choose a table
              </span>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Select your base from our curated collection.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                Browse tables
              </span>
            </div>
            <div className="flex items-center gap-2">
              <TableGlyph />
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
            </div>
          </button>
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Feature strip                                                 */}
        {/* ------------------------------------------------------------ */}
        <section
          className="mt-4 grid grid-cols-2 gap-6 rounded-2xl border border-card-border bg-card p-5 sm:grid-cols-4 sm:p-6"
          data-testid="section-features"
        >
          <FeatureItem
            Icon={Box}
            title="Custom Made"
            description="Designed by you. Made just for you."
          />
          <FeatureItem
            Icon={BadgeCheck}
            title="Quality You'll Love"
            description="Premium materials. Built to last."
          />
          <FeatureItem
            Icon={CalendarClock}
            title="Made in About 1 Week"
            description="Fast, reliable & carefully crafted."
          />
          <FeatureItem
            Icon={Heart}
            title="Delivered to You"
            description="Drop-shipped straight to your door."
          />
        </section>

        {/* ------------------------------------------------------------ */}
        {/* Roadmap                                                       */}
        {/* ------------------------------------------------------------ */}
        <section id="roadmap" className="mb-8 mt-10" data-testid="section-roadmap">
          <div className="rounded-2xl border border-dashed border-card-border bg-card/50 p-6 md:p-8">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
              Coming soon
            </span>
            <h2 className="mt-3 font-serif text-lg font-semibold md:text-xl" data-testid="text-roadmap-title">
              A catalog of supported tables from trusted suppliers
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Beyond fully custom designs, we're growing a browsable catalog of pre-approved
              coffee tables sourced from selected suppliers — so you can pick a proven base
              outright, or use it as a starting point for your own center design. The IKEA LACK
              base table shown throughout this build is our first confirmed catalog entry; more
              are being added.
            </p>
          </div>
        </section>
      </main>

      <HomeFooter />
      <BottomMobileNav onCreate={handleStart} isCreating={createProject.isPending} />
    </div>
  );
}

function HomeTopBar({
  theme,
  toggleTheme,
  menuOpen,
  setMenuOpen,
  onStart,
}: {
  theme: "light" | "dark";
  toggleTheme: () => void;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  onStart: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-8">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className="hover-elevate rounded-md p-2 text-foreground md:hidden"
              data-testid="button-open-menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <nav aria-label="Mobile" className="mt-8 flex flex-col gap-1">
              <SheetClose asChild>
                <a href="#transformation" className="hover-elevate rounded-md px-3 py-2.5 text-sm font-medium">
                  The transformation
                </a>
              </SheetClose>
              <SheetClose asChild>
                <a href="#choose-table" className="hover-elevate rounded-md px-3 py-2.5 text-sm font-medium">
                  Choose a table
                </a>
              </SheetClose>
              <SheetClose asChild>
                <a href="#roadmap" className="hover-elevate rounded-md px-3 py-2.5 text-sm font-medium">
                  Roadmap
                </a>
              </SheetClose>
              <button
                type="button"
                onClick={toggleTheme}
                className="hover-elevate mt-2 flex items-center gap-2 rounded-md px-3 py-2.5 text-left text-sm font-medium"
                data-testid="button-theme-toggle-mobile"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                Switch to {theme === "dark" ? "light" : "dark"} mode
              </button>
            </nav>
          </SheetContent>
        </Sheet>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          <a href="#transformation" className="hover-elevate rounded-md px-3 py-2 text-sm font-medium text-muted-foreground">
            The transformation
          </a>
          <a href="#choose-table" className="hover-elevate rounded-md px-3 py-2 text-sm font-medium text-muted-foreground">
            Choose a table
          </a>
          <a href="#roadmap" className="hover-elevate rounded-md px-3 py-2 text-sm font-medium text-muted-foreground">
            Roadmap
          </a>
        </nav>

        <a href="#top" className="flex flex-col items-center gap-0.5" data-testid="link-home-logo">
          <div className="flex items-center gap-1.5">
            <Logo size={22} className="text-primary" />
            <span className="font-serif text-lg font-semibold leading-none tracking-wide">
              <span className="text-foreground">Nest</span>
              <span className="text-primary">Forge</span>
            </span>
          </div>
          <span className="text-[9px] font-semibold uppercase tracking-[0.35em] text-muted-foreground">
            Studio
          </span>
        </a>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            data-testid="button-theme-toggle"
            className="hover-elevate hidden rounded-md p-2 text-muted-foreground md:flex"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={onStart}
            aria-label="Start a new table design"
            className="hover-elevate relative rounded-md p-2 text-foreground"
            data-testid="button-cart"
          >
            <ShoppingCart className="h-5 w-5" />
          </button>
        </div>
      </div>
      <p className="pb-2.5 text-center text-[10px] font-semibold uppercase tracking-[0.25em] text-primary">
        Design it. We craft it. You love it.
      </p>
    </header>
  );
}

function PathCard({
  image,
  Icon,
  title,
  description,
  cta,
  onClick,
  disabled,
  testId,
}: {
  image: string;
  Icon: typeof PenLine;
  title: string;
  description: string;
  cta: string;
  onClick: () => void;
  disabled: boolean;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="hover-elevate relative overflow-hidden rounded-2xl border border-card-border text-left"
      data-testid={`card-${testId}`}
    >
      <img src={image} alt="" aria-hidden="true" className="h-56 w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
        <Icon className="h-6 w-6 text-primary" />
        <h3 className="text-base font-bold uppercase tracking-wide text-white">{title}</h3>
        <p className="text-xs text-white/80">{description}</p>
        <span className="mt-1 rounded-full bg-primary px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
          {cta}
        </span>
      </div>
    </button>
  );
}

function FeatureItem({
  Icon,
  title,
  description,
}: {
  Icon: typeof Box;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center" data-testid={`feature-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <Icon className="h-6 w-6 text-primary" />
      <h3 className="text-[11px] font-bold uppercase tracking-wide text-primary">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function TableGlyph() {
  return (
    <svg viewBox="0 0 80 50" className="h-10 w-16 text-primary" fill="none" aria-hidden="true">
      <path
        d="M8 20L40 8L72 20L40 32Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 22V38M68 22V38M28 27.5V43.5M52 27.5V43.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HomeFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-4 py-8 text-center text-xs text-muted-foreground md:px-8">
        <div className="flex items-center gap-2 text-foreground">
          <Logo size={18} className="text-primary" />
          <span className="font-serif font-semibold">NestForge Studio</span>
        </div>
        <p>Made-to-order, manufacturable-by-design coffee tables.</p>
      </div>
    </footer>
  );
}
