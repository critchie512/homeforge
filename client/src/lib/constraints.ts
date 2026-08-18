import { apiRequest } from "@/lib/queryClient";
import type { ProductionConstraints } from "@shared/tableDesign";

// Single fetch point for the production-constraints config. The client NEVER
// hard-codes limits — it always asks the backend, which reads the same
// config/production-constraints.json file used by the validation engine.
export async function fetchProductionConstraints(): Promise<ProductionConstraints> {
  const res = await apiRequest("GET", "/api/config/production-constraints");
  return res.json();
}
