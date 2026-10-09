import { prisma } from "../prisma";
import { encrypt, decrypt } from "../crypto";
import { EventType } from "../types";

export interface CalendarSyncResult {
  syncedCount: number;
  conflicts: {
    eventA: string;
    eventB: string;
    overlapMinutes: number;
  }[];
  status: "SUCCESS" | "UNCONFIGURED" | "ERROR";
  error?: string;
}

/**
 * Exchanges Google OAuth code for access and refresh tokens.
 */
export async function exchangeGoogleCodeForTokens(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth credentials are not configured in environment.");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to exchange authorization code: ${errText}`);
  }

  return res.json();
}

/**
 * Refreshes an expired Google access token using the stored encrypted refresh token.
 */
export async function refreshGoogleAccessToken(userId: string): Promise<string> {
  const syncState = await prisma.calendarSyncState.findUnique({
    where: { userId },
  });

  if (!syncState?.syncTokenEncrypted) {
    throw new Error("No Google Calendar refresh token stored.");
  }

  const refreshToken = decrypt(syncState.syncTokenEncrypted);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to refresh Google access token.");
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Synchronizes events between Google Calendar and Watchtower.
 */
export async function syncGoogleCalendar(userId: string): Promise<CalendarSyncResult> {
  const syncState = await prisma.calendarSyncState.findUnique({
    where: { userId },
  });

  if (!syncState || !syncState.syncTokenEncrypted || syncState.status !== "CONNECTED") {
    return {
      syncedCount: 0,
      conflicts: [],
      status: "UNCONFIGURED",
      error: "Google Calendar is disconnected or not configured.",
    };
  }

  try {
    const accessToken = await refreshGoogleAccessToken(userId);
    const now = new Date();
    const timeMin = new Date(now.getTime() - 7 * 86400000).toISOString();
    const timeMax = new Date(now.getTime() + 30 * 86400000).toISOString();

    const calUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
    const res = await fetch(calUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      throw new Error(`Google Calendar API returned status ${res.status}`);
    }

    const data = await res.json();
    const items = data.items || [];
    let syncedCount = 0;

    for (const item of items) {
      const startStr = item.start?.dateTime || item.start?.date;
      const endStr = item.end?.dateTime || item.end?.date;
      if (!startStr || !endStr) continue;

      const startTime = new Date(startStr);
      const endTime = new Date(endStr);

      await prisma.calendarEvent.upsert({
        where: { id: `google-${item.id}` },
        update: {
          title: item.summary || "Untitled Event",
          description: item.description || null,
          startTime,
          endTime,
          syncedAt: new Date(),
        },
        create: {
          id: `google-${item.id}`,
          userId,
          externalId: item.id,
          provider: "google",
          title: item.summary || "Untitled Event",
          description: item.description || null,
          startTime,
          endTime,
          eventType: EventType.OTHER,
          isFixed: true,
          syncedAt: new Date(),
        },
      });
      syncedCount++;
    }

    // Check for scheduling conflicts in today's events
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const todayEvents = await prisma.calendarEvent.findMany({
      where: { userId, startTime: { lte: todayEnd }, endTime: { gte: todayStart } },
      orderBy: { startTime: "asc" },
    });

    const conflicts: CalendarSyncResult["conflicts"] = [];
    for (let i = 0; i < todayEvents.length - 1; i++) {
      const a = todayEvents[i];
      const b = todayEvents[i + 1];
      if (a.endTime.getTime() > b.startTime.getTime()) {
        const overlap = Math.floor(
          (a.endTime.getTime() - b.startTime.getTime()) / 60000
        );
        conflicts.push({
          eventA: a.title,
          eventB: b.title,
          overlapMinutes: overlap,
        });
      }
    }

    await prisma.calendarSyncState.update({
      where: { userId },
      data: {
        lastIncrementalSyncAt: new Date(),
        status: "CONNECTED",
        lastError: null,
      },
    });

    return {
      syncedCount,
      conflicts,
      status: "SUCCESS",
    };
  } catch (err: any) {
    await prisma.calendarSyncState.update({
      where: { userId },
      data: {
        lastError: err.message,
      },
    });
    return {
      syncedCount: 0,
      conflicts: [],
      status: "ERROR",
      error: err.message,
    };
  }
}

