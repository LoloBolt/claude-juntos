import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  const db = getDb();
  const people = db
    .prepare(`SELECT name FROM people ORDER BY name COLLATE NOCASE ASC`)
    .all() as { name: string }[];

  return NextResponse.json({ people: people.map((p) => p.name) });
}
