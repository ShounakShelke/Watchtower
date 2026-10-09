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

    // 1. Mark candidate approved
    await prisma.memoryCandidate.update({
      where: { id: candidate.id },
      data: { status: "APPROVED", reviewedAt: new Date() },
    });

    // 2. Upsert into durable Memory
    const memory = await prisma.memory.upsert({
      where: { userId_key: { userId: u.id, key: candidate.key } },
      update: {
        value: candidate.value,
        category: candidate.category,
        confidence: candidate.confidence,
        source: candidate.sourceType,
      },
      create: {
        userId: u.id,
        key: candidate.key,
        value: candidate.value,
        category: candidate.category,
        confidence: candidate.confidence,
        source: candidate.sourceType,
      },
    });

    await prisma.activity.create({
      data: {
        userId: u.id,
        activityType: "MEMORY_APPROVED",
        description: `Approved durable memory: [${memory.key}] "${memory.value}".`,
      },
    });

    return NextResponse.json({ success: true, memory });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

