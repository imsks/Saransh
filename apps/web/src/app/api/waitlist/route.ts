import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const { name, email, language, source } = body as {
    name?: unknown;
    email?: unknown;
    language?: unknown;
    source?: unknown;
  };

  const normalizedName = normalizeString(name);
  const normalizedEmail = normalizeString(email).toLowerCase();
  const normalizedLanguage = normalizeString(language);
  const normalizedSource = normalizeString(source);

  if (!normalizedName) {
    return NextResponse.json({ ok: false, message: "Name is required." }, { status: 400 });
  }

  if (!normalizedEmail) {
    return NextResponse.json({ ok: false, message: "Email is required." }, { status: 400 });
  }

  if (!normalizedLanguage) {
    return NextResponse.json({ ok: false, message: "Language is required." }, { status: 400 });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(normalizedEmail)) {
    return NextResponse.json({ ok: false, message: "Please enter a valid email address." }, { status: 400 });
  }

  try {
    await sql`
      INSERT INTO waitlist (name, email, language, source)
      VALUES (${normalizedName}, ${normalizedEmail}, ${normalizedLanguage}, ${normalizedSource || null})
    `;

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: unknown) {
    const pgErr = err as { code?: string; message?: string };

    if (pgErr?.code === "23505") {
      return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
    }

    console.error("[waitlist] database insert failed:", pgErr?.message ?? err);
    return NextResponse.json({ ok: false, message: "Unable to save your waitlist signup right now." }, { status: 500 });
  }
}
