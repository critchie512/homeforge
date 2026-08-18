import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QualificationSticker } from "@/components/QualificationSticker";
import { CheckCircle2, Circle, Loader2, PlayCircle, AlertOctagon } from "lucide-react";
import type { DigitalTwin, Order, Project, QualificationRecord } from "@shared/schema";

const HAPPY_PATH_LABELS: Record<string, string> = {
  draft: "Draft",
  design_valid: "Design Valid",
  ready_to_order: "Ready to Order",
  ordered: "Ordered",
  production_queued: "Production Queued",
  printing: "Printing",
  post_processing: "Post-Processing",
  qualification_pending: "Qualification Pending",
  qualified: "Qualified",
  ready_to_ship: "Ready to Ship",
  shipped: "Shipped",
  delivered: "Delivered",
};

const HAPPY_PATH_ORDER = Object.keys(HAPPY_PATH_LABELS);

const EXCEPTION_LABELS: Record<string, string> = {
  design_invalid: "Design Invalid",
  production_hold: "Production Hold",
  qualification_failed: "Qualification Failed",
  cancelled: "Cancelled",
};

export default function Track() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const projectId = Number(projectIdParam);

  const orderQuery = useQuery<Order>({
    queryKey: ["/api/projects", String(projectId), "order"],
    retry: false,
  });
  const projectQuery = useQuery<Project>({ queryKey: ["/api/projects", String(projectId)] });

  const orderId = orderQuery.data?.id;

  const twinQuery = useQuery<{ twin: DigitalTwin; qualification: QualificationRecord | null }>({
    queryKey: ["/api/orders", String(orderId), "digital-twin"],
    enabled: Boolean(orderId),
    retry: false,
  });

  const simulateNext = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/simulate-next`, {});
      return (await res.json()) as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", String(projectId), "order"] });
      queryClient.invalidateQueries({ queryKey: ["/api/orders", String(orderId), "digital-twin"] });
    },
  });

  const setException = useMutation({
    mutationFn: async (status: string) => {
      const res = await apiRequest("POST", `/api/orders/${orderId}/set-exception`, { status });
      return (await res.json()) as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", String(projectId), "order"] });
    },
  });

  if (orderQuery.isLoading) {
    return (
      <div className="min-h-screen">
        <TopNav projectId={projectId} />
        <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <div className="skeleton skeleton-heading" />
        </main>
      </div>
    );
  }

  if (!orderQuery.data) {
    return (
      <div className="min-h-screen">
        <TopNav projectId={projectId} />
        <main className="mx-auto max-w-4xl px-4 py-16 text-center md:px-8">
          <h1 className="font-display text-xl font-semibold">No order to track yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Place an order in Checkout to see production tracking here.
          </p>
          <Button asChild className="mt-6" data-testid="button-go-checkout-from-track">
            <Link href={`/checkout/${projectId}`}>Go to Checkout</Link>
          </Button>
        </main>
      </div>
    );
  }

  const order = orderQuery.data;
  const isException = order.status in EXCEPTION_LABELS;
  const currentIndex = HAPPY_PATH_ORDER.indexOf(order.status);
  const isFinalStep = currentIndex === HAPPY_PATH_ORDER.length - 1;

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav projectId={projectId} />
      <main className="mx-auto flex-1 w-full max-w-4xl px-4 py-8 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-xl font-semibold" data-testid="text-page-title">
            Track — {projectQuery.data?.name}
          </h1>
          <Badge
            variant={isException ? "destructive" : "default"}
            data-testid="badge-order-status"
          >
            {isException ? EXCEPTION_LABELS[order.status] : HAPPY_PATH_LABELS[order.status]}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Order #{order.id}</p>

        {isException ? (
          <div
            className="mt-8 flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4"
            data-testid="panel-exception-state"
          >
            <AlertOctagon className="h-5 w-5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">
                {EXCEPTION_LABELS[order.status]}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                This order is in an exception state outside the normal production flow. In a real
                system this would notify the customer with next steps.
              </p>
            </div>
          </div>
        ) : (
          <ol className="mt-8 space-y-1" data-testid="list-production-stepper">
            {HAPPY_PATH_ORDER.map((status, index) => {
              const isDone = index < currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <li
                  key={status}
                  className={`flex items-center gap-3 rounded-md px-3 py-2 ${
                    isCurrent ? "bg-accent" : ""
                  }`}
                  data-testid={`step-status-${status}`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <Circle
                      className={`h-4 w-4 shrink-0 ${isCurrent ? "text-primary" : "text-muted-foreground"}`}
                    />
                  )}
                  <span
                    className={`text-sm ${
                      isCurrent ? "font-medium text-foreground" : isDone ? "text-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {HAPPY_PATH_LABELS[status]}
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {!isException && !isFinalStep && (
            <Button
              onClick={() => simulateNext.mutate()}
              disabled={simulateNext.isPending}
              data-testid="button-simulate-next"
            >
              {simulateNext.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <PlayCircle className="h-4 w-4" /> Simulate next update
                </>
              )}
            </Button>
          )}
          <p className="text-xs text-muted-foreground" data-testid="text-simulate-disclaimer">
            Demo control — there's no real printer/production system connected yet.
          </p>
        </div>

        {twinQuery.data?.twin && (
          <div className="mt-10 max-w-sm">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Pre-ship qualification
            </h2>
            <QualificationSticker
              physicalId={twinQuery.data.twin.physicalId}
              qualified={Boolean(twinQuery.data.qualification?.qualified)}
              statusLabel={
                twinQuery.data.qualification?.status === "qualified"
                  ? "Qualified"
                  : twinQuery.data.qualification?.status === "failed"
                    ? "Failed inspection"
                    : "Pending"
              }
            />
          </div>
        )}

        <details className="mt-12 rounded-lg border border-card-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-medium text-muted-foreground" data-testid="toggle-admin-exceptions">
            Admin: force an exception state (demo)
          </summary>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(EXCEPTION_LABELS).map(([status, label]) => (
              <Button
                key={status}
                size="sm"
                variant="outline"
                onClick={() => setException.mutate(status)}
                data-testid={`button-exception-${status}`}
              >
                {label}
              </Button>
            ))}
          </div>
        </details>
      </main>

      <footer className="border-t border-border py-6" data-testid="footer-trust-badges">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-4 text-xs text-muted-foreground md:px-8">
          <span data-testid="text-trust-made-to-order">Made to order (placeholder copy)</span>
          <span aria-hidden="true">·</span>
          <span data-testid="text-trust-inspected">Quality inspected (placeholder copy)</span>
          <span aria-hidden="true">·</span>
          <span data-testid="text-trust-shipping">Ships in 4–6 weeks (placeholder copy)</span>
        </div>
      </footer>
    </div>
  );
}
