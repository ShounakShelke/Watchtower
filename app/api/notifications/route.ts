import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { user } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const u = await user();
    const notifications = await prisma.notificationEvent.findMany({
      where: { userId: u.id, status: { in: ["PENDING", "SENT"] } },
      orderBy: { scheduledAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ notifications });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
