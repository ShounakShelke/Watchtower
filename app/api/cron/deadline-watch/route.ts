import { NextResponse } from "next/server";
import { user } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { TaskStatus, Priority } from "@/lib/types";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized cron execution" }, { status: 401 });
  }

  try {
    const u = await user();
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 3600 * 1000);

    const urgentTasks = await prisma.task.findMany({
      where: {
        userId: u.id,
        status: { in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS] },
        dueDate: { lte: next24h },
      },
      include: { project: true },
    });

    const notificationsCreated = [];

    for (const task of urgentTasks) {
      const dedupeKey = `deadline_${task.id}_${now.toISOString().slice(0, 10)}`;
      const existing = await prisma.notificationEvent.findFirst({
        where: { dedupeKey },
      });

      if (!existing) {
        const isOverdue = task.dueDate && task.dueDate.getTime() < now.getTime();
        const notif = await prisma.notificationEvent.create({
          data: {
            userId: u.id,
            type: isOverdue ? "overdue" : "deadline",
            title: isOverdue ? `Overdue: ${task.title}` : `Due Soon: ${task.title}`,
            body: `Project: ${task.project?.name || "General"} · Due: ${
              task.dueDate ? task.dueDate.toLocaleString() : "today"
            }`,
            priority: isOverdue ? Priority.CRITICAL : Priority.HIGH,
            dedupeKey,
          },
        });
        notificationsCreated.push(notif.id);
      }
    }

    return NextResponse.json({
      success: true,
      urgentCount: urgentTasks.length,
      notificationsCreated: notificationsCreated.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

