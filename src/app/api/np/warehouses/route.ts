import type { NextRequest } from "next/server";
import { listWarehouses, npFailureResponse } from "@/lib/nova-poshta";

export async function GET(request: NextRequest) {
  const cityRef = request.nextUrl.searchParams.get("cityRef")?.trim() ?? "";
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!cityRef) return Response.json({ warehouses: [] });

  const result = await listWarehouses(cityRef, query);
  if (!result.ok) return npFailureResponse(result.reason, "warehouses");

  return Response.json({ warehouses: result.data });
}
