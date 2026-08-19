import { Link, useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { useTheme } from "@/components/ThemeProvider";
import { Moon, Sun } from "lucide-react";

interface TopNavProps {
  projectId?: number;
}

const TABS = [
  { key: "configure", label: "Configure" },
  { key: "review", label: "Review" },
  { key: "checkout", label: "Checkout" },
  { key: "track", label: "Track" },
] as const;

export function TopNav({ projectId }: TopNavProps) {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();

  const activeTab = TABS.find((t) => location.startsWith(`/${t.key}`))?.key;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-foreground hover-elevate rounded-md px-2 py-1.5 -ml-2"
          data-testid="link-home"
        >
          <Logo size={26} className="text-primary" />
          <span className="font-display text-sm font-semibold tracking-wide">NestForge Studio</span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {TABS.map((tab) => {
            const href = projectId ? `/${tab.key}/${projectId}` : `/${tab.key}`;
            const isActive = activeTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={href}
                data-testid={`link-nav-${tab.key}`}
                className={`hover-elevate rounded-md px-4 py-2 text-sm font-medium uppercase tracking-wide transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

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

      <nav aria-label="Primary mobile" className="flex items-center gap-1 overflow-x-auto border-t border-border px-2 py-1.5 md:hidden">
        {TABS.map((tab) => {
          const href = projectId ? `/${tab.key}/${projectId}` : `/${tab.key}`;
          const isActive = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={href}
              data-testid={`link-nav-mobile-${tab.key}`}
              className={`hover-elevate shrink-0 rounded-md px-3 py-1.5 text-xs font-medium uppercase tracking-wide ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
