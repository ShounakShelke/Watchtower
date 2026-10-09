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

    const candidate = await prisma.memoryCandidate.findFirst({
      where: { id, userId: u.id },
    });

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
    }

    const updated = await prisma.memoryCandidate.update({
      where: { id: candidate.id },
      data: { status: "REJECTED", reviewedAt: new Date() },
    });

    return NextResponse.json({ success: true, candidate: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

