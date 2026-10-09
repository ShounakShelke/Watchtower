import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { user } from "@/lib/data";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") || "";
    const u = await user();

    const memories = await prisma.memory.findMany({
      where: {
        userId: u.id,
        ...(q
          ? {
              OR: [
                { key: { contains: q, mode: "insensitive" } },
                { value: { contains: q, mode: "insensitive" } },
                { category: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    const pendingCandidates = await prisma.memoryCandidate.findMany({
      where: { userId: u.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ memories, pendingCandidates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

