import { NextResponse } from "next/server";
import { user } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { Priority } from "@/lib/types";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  try {
    const u = await user();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [doneCount, focusAggregate] = await Promise.all([
      prisma.task.count({
        where: { userId: u.id, status: "DONE", completedAt: { gte: today } },
      }),
      prisma.activity.aggregate({
        where: { userId: u.id, createdAt: { gte: today } },
        _sum: { durationMinutes: true },
      }),
    ]);

    const focusMinutes = focusAggregate._sum.durationMinutes || 0;
    const haveDoneEnough = focusMinutes >= 180 || doneCount >= 3;

    const dedupeKey = `evening_review_${today.toISOString().slice(0, 10)}`;
    const notif = await prisma.notificationEvent.create({
      data: {
        userId: u.id,
        type: "evening_review",
        title: "Evening Review Ready",
        body: `${doneCount} tasks completed · ${focusMinutes}m focused activity today. ${
          haveDoneEnough
            ? "You have done enough today. Permission to rest and recharge."
            : "Review open priorities before wrapping up."
        }`,
        priority: Priority.MEDIUM,
        dedupeKey,
      },
    });

    return NextResponse.json({
      success: true,
      doneCount,
      focusMinutes,
      haveDoneEnough,
      notificationId: notif.id,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

