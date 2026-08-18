import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TopNav } from "@/components/TopNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import type { DesignVersion, Order, Project } from "@shared/schema";
import type { ValidationResult } from "@shared/tableDesign";

export default function Checkout() {
  const { projectId: projectIdParam } = useParams<{ projectId: string }>();
  const projectId = Number(projectIdParam);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const projectQuery = useQuery<Project>({ queryKey: ["/api/projects", String(projectId)] });
  const latestVersionQuery = useQuery<DesignVersion>({
    queryKey: ["/api/projects", String(projectId), "design-versions", "latest"],
    retry: false,
  });

  const validation = latestVersionQuery.data?.validation as ValidationResult | undefined;
  const canOrder = Boolean(validation?.valid);

  const placeOrder = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/order`, {
        customerName: name || null,
        customerEmail: email || null,
        shippingAddress: address || null,
      });
      return (await res.json()) as Order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", String(projectId), "order"] });
      setPlacedOrder(order);
    },
  });

  if (placedOrder) {
    return (
      <div className="min-h-screen">
        <TopNav projectId={projectId} />
        <main className="mx-auto max-w-xl px-4 py-20 text-center md:px-8">
          <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 font-display text-xl font-semibold" data-testid="text-thank-you">
            Thank you — your order is in.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Order #{placedOrder.id} for "{projectQuery.data?.name}" has been placed. This is a demo
            checkout — no real payment was processed.
          </p>
          <Button asChild className="mt-8" data-testid="button-go-track">
            <Link href={`/track/${projectId}`}>Track production</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopNav projectId={projectId} />
      <main className="mx-auto max-w-xl px-4 py-8 md:px-8">
        <h1 className="font-display text-xl font-semibold" data-testid="text-page-title">
          Checkout — {projectQuery.data?.name}
        </h1>

        <div className="mt-2 flex items-center gap-1.5 rounded-md border border-chart-2/30 bg-chart-2/10 px-3 py-2 text-xs text-foreground/90">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          Placeholder checkout — no real payment processor is connected. This step exists to show
          the flow end-to-end.
        </div>

        {!canOrder && (
          <p className="mt-4 text-sm text-destructive" data-testid="text-checkout-blocked">
            Your saved design isn't manufacturable yet. Go back to Configure and resolve the
            errors before ordering.
          </p>
        )}

        <form
          className="mt-6 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (canOrder) placeOrder.mutate();
          }}
        >
          <div>
            <Label htmlFor="checkout-name">Name</Label>
            <Input
              id="checkout-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Rivera"
              data-testid="input-checkout-name"
            />
          </div>
          <div>
            <Label htmlFor="checkout-email">Email</Label>
            <Input
              id="checkout-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jordan@example.com"
              data-testid="input-checkout-email"
            />
          </div>
          <div>
            <Label htmlFor="checkout-address">Shipping address</Label>
            <Textarea
              id="checkout-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Kiln Street, Portland, OR"
              data-testid="input-checkout-address"
            />
          </div>

          <div className="rounded-lg border border-card-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Payment</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Placeholder payment step — card details would be collected here via a real processor
              in production.
            </p>
            <Input disabled placeholder="•••• •••• •••• ••••" className="mt-3" data-testid="input-checkout-card-placeholder" />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!canOrder || placeOrder.isPending}
            data-testid="button-place-order"
          >
            {placeOrder.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Place order"}
          </Button>
        </form>
      </main>
    </div>
  );
}
