import { Link, useLocation } from "wouter";
import { Home, Table2, Plus, Heart, User } from "lucide-react";

interface BottomMobileNavProps {
  onCreate: () => void;
  isCreating: boolean;
}

/**
 * Fixed bottom tab bar shown on small screens only, matching the mobile app
 * mockup: Home / Tables / + (create) / Saved / Account. The app doesn't yet
 * have a table-browsing page, saved-designs list, or an account system, so
 * "Tables" and the center "+" both start a new design (the closest existing
 * flow — Configure's first step IS the curated base-table catalog), and
 * "Saved" / "Account" are shown but visually muted since there's nothing to
 * link to yet.
 */
export function BottomMobileNav({ onCreate, isCreating }: BottomMobileNavProps) {
  const [location] = useLocation();
  const isHome = location === "/" || location === "";

  return (
    <nav
      aria-label="Primary mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      data-testid="nav-bottom-mobile"
    >
      <div className="mx-auto flex max-w-lg items-center justify-between px-2 py-2">
        <Link
          href="/"
          className={`flex flex-1 flex-col items-center gap-1 rounded-md py-1.5 text-[10px] font-medium uppercase tracking-wide ${
            isHome ? "text-primary" : "text-muted-foreground"
          }`}
          data-testid="link-bottom-home"
        >
          <Home className="h-5 w-5" />
          Home
        </Link>

        <button
          type="button"
          onClick={onCreate}
          disabled={isCreating}
          className="flex flex-1 flex-col items-center gap-1 rounded-md py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground disabled:opacity-60"
          data-testid="link-bottom-tables"
        >
          <Table2 className="h-5 w-5" />
          Tables
        </button>

        <button
          type="button"
          onClick={onCreate}
          disabled={isCreating}
          aria-label="Start a new table design"
          className="-mt-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg disabled:opacity-70"
          data-testid="button-bottom-create"
        >
          <Plus className="h-6 w-6" />
        </button>

        <button
          type="button"
          aria-disabled="true"
          title="Saved designs — coming soon"
          className="flex flex-1 flex-col items-center gap-1 rounded-md py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/40"
          data-testid="link-bottom-saved"
        >
          <Heart className="h-5 w-5" />
          Saved
        </button>

        <button
          type="button"
          aria-disabled="true"
          title="Account — coming soon"
          className="flex flex-1 flex-col items-center gap-1 rounded-md py-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/40"
          data-testid="link-bottom-account"
        >
          <User className="h-5 w-5" />
          Account
        </button>
      </div>
    </nav>
  );
}
