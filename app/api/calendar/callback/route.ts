import { NextResponse } from "next/server";
import { exchangeGoogleCodeForTokens, syncGoogleCalendar } from "@/lib/calendar/sync";
import { encrypt } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { user } from "@/lib/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/calendar?status=error&message=${encodeURIComponent(error || "No code received")}`);
  }

  try {
    const tokens = await exchangeGoogleCodeForTokens(code);
    const u = await user();

    if (tokens.refresh_token) {
      const encryptedRefreshToken = encrypt(tokens.refresh_token);

      await prisma.calendarSyncState.upsert({
        where: { userId: u.id },
        update: {
          syncTokenEncrypted: encryptedRefreshToken,
          status: "CONNECTED",
          lastFullSyncAt: new Date(),
          lastError: null,
        },
        create: {
          userId: u.id,
          syncTokenEncrypted: encryptedRefreshToken,
          status: "CONNECTED",
          lastFullSyncAt: new Date(),
        },
      });

      await prisma.integration.upsert({
        where: { userId_provider: { userId: u.id, provider: "google" } },
        update: { status: "CONNECTED" },
        create: { userId: u.id, provider: "google", status: "CONNECTED" },
      });

      // Run initial sync
      await syncGoogleCalendar(u.id);
    }

    return NextResponse.redirect(`${appUrl}/calendar?status=connected`);
  } catch (err: any) {
    console.error("Calendar callback error:", err);
    return NextResponse.redirect(`${appUrl}/calendar?status=error&message=${encodeURIComponent(err.message)}`);
  }
}
