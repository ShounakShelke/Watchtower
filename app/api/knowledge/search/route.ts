import { NextResponse } from "next/server";
import { hybridSearch } from "@/lib/retrieval/engine";
import { user } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    if (!q.trim()) {
      return NextResponse.json({ results: [] });
    }

    const u = await user();
    const results = await hybridSearch(u.id, q);
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

