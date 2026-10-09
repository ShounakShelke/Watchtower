import { NextResponse } from "next/server";
import { user } from "@/lib/data";
import { syncGoogleCalendar } from "@/lib/calendar/sync";
import { refreshIntelligence } from "@/lib/intelligence/clustering";
import { replanDay } from "@/lib/planning/engine";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  // Protect with CRON_SECRET if configured
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  try {
    const u = await user();

    // 1. Sync Calendar
    const calResult = await syncGoogleCalendar(u.id);

    // 2. Refresh News
    const newsResult = await refreshIntelligence().catch(() => ({ clustersCreated: 0 }));

    // 3. Assemble Daily Plan
    const planResult = await replanDay(u.id, "morning_sync", "Automated Morning Planning Sync");

    // 4. Create Notification
    await prisma.notificationEvent.create({
      data: {
        userId: u.id,
        type: "morning_sync",
        title: "Morning Sync Complete",
        body: planResult.plan.summary || "Today's schedule and focus priorities are ready.",
        priority: "MEDIUM",
        dedupeKey: `morning_sync_${new Date().toISOString().slice(0, 10)}`,
      },
    });

    return NextResponse.json({
      success: true,
      calendar: calResult,
      news: newsResult,
      planId: planResult.plan.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

