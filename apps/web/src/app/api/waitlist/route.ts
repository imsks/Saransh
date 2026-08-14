import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, language, source } = body;

  try {
    await sql`
      INSERT INTO waitlist (name, email, language, source)
      VALUES (${name.trim()}, ${email.trim().toLowerCase()}, ${language}, ${source || null})
    `;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr?.code === "23505") {
      return NextResponse.json({ ok: true }, { status: 201 });
    }
    console.error("[waitlist] error:", err);
    return NextResponse.json({ ok: true }, { status: 201 });
  }
}
