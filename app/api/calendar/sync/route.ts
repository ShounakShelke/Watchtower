import { NextResponse } from "next/server";
import { syncGoogleCalendar } from "@/lib/calendar/sync";
import { user } from "@/lib/data";

export async function POST() {
  try {
    const u = await user();
    const result = await syncGoogleCalendar(u.id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

