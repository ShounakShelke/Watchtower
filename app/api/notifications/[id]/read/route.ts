import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { user } from "@/lib/data";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const u = await user();

    const notif = await prisma.notificationEvent.update({
      where: { id, userId: u.id },
      data: { status: "READ" },
    });

    return NextResponse.json({ success: true, notification: notif });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

