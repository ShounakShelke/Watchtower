import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { user } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const u = await user();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const plan = await prisma.dailyPlan.findFirst({
      where: { userId: u.id, date: today, status: "ACTIVE" },
      include: {
        items: { orderBy: { order: "asc" } },
        revisions: { orderBy: { createdAt: "desc" } },
      },
    });

    return NextResponse.json({ plan });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
