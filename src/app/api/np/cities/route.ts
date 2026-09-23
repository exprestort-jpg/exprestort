import type { NextRequest } from "next/server";
import { npFailureResponse, searchCities } from "@/lib/nova-poshta";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return Response.json({ cities: [] });

  const result = await searchCities(query);
  console.log("--> result", result);
  if (!result.ok) return npFailureResponse(result.reason, "cities");

  return Response.json({ cities: result.data });
}
