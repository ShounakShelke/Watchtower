import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { user } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const u = await user();
    const syncState = await prisma.calendarSyncState.findUnique({
      where: { userId: u.id },
    });

    const integration = await prisma.integration.findFirst({
      where: { userId: u.id, provider: "google" },
    });

    const isConnected = integration?.status === "CONNECTED" && Boolean(syncState?.syncTokenEncrypted);

    return NextResponse.json({
      connected: isConnected,
      lastFullSyncAt: syncState?.lastFullSyncAt || null,
      lastIncrementalSyncAt: syncState?.lastIncrementalSyncAt || null,
      status: syncState?.status || "DISCONNECTED",
      lastError: syncState?.lastError || null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
