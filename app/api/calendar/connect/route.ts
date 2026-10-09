import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

export async function GET() {
  const id = process.env.GOOGLE_CLIENT_ID;
  const redirect = process.env.GOOGLE_REDIRECT_URI;

  if (!id || !redirect) {
    return NextResponse.json(
      { error: "Google Calendar OAuth is not configured in environment variables." },
      { status: 503 }
    );
  }

  const params = new URLSearchParams({
    client_id: id,
    redirect_uri: redirect,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
    state: randomUUID(),
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
