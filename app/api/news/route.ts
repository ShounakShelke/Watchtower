import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGdeltNews } from "@/lib/gdelt";
const schema=z.enum(["ai","motorsport"]);
export async function GET(request:NextRequest) {
  const category=schema.safeParse(request.nextUrl.searchParams.get("category") ?? "ai");
  if(!category.success) return NextResponse.json({error:"Choose ai or motorsport."},{status:400});
  try { return NextResponse.json({provider:"GDELT",items:await getGdeltNews(category.data)}); }
  catch { return NextResponse.json({provider:"GDELT",items:[],error:"Intelligence feed unavailable. Cached database items remain available."},{status:503}); }
}
