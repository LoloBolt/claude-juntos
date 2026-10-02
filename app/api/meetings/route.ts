import { NextRequest, NextResponse } from "next/server";
import { getDb, normalizeName } from "@/lib/db";

export async function GET(request: NextRequest) {
  const db = getDb();
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? 50);

  const meetings = db
    .prepare(
      `SELECT id, date, title, created_at FROM meetings ORDER BY date DESC, id DESC LIMIT ?`
    )
    .all(limit) as { id: number; date: string; title: string; created_at: string }[];

  const attendeesStmt = db.prepare(
    `SELECT p.name FROM attendance a
     JOIN people p ON p.id = a.person_id
     WHERE a.meeting_id = ?
     ORDER BY p.name COLLATE NOCASE ASC`
  );

  const result = meetings.map((m) => ({
    ...m,
    attendees: (attendeesStmt.all(m.id) as { name: string }[]).map((r) => r.name),
  }));

  return NextResponse.json({ meetings: result });
}

export async function POST(request: NextRequest) {
  const db = getDb();
  const body = await request.json().catch(() => null);

  if (!body || typeof body.date !== "string" || !body.date) {
    return NextResponse.json({ error: "A meeting date is required." }, { status: 400 });
  }

  const rawAttendees = Array.isArray(body.attendees) ? body.attendees : [];
  const names = Array.from(
    new Set(
      rawAttendees
        .map((n: unknown) => (typeof n === "string" ? normalizeName(n) : ""))
        .filter((n: string) => n.length > 0)
    )
  ) as string[];

  const title =
    typeof body.title === "string" && body.title.trim().length > 0
      ? body.title.trim()
      : "Weekly Meeting";

  const insertPerson = db.prepare(
    `INSERT INTO people (name) VALUES (?)
     ON CONFLICT(name) DO NOTHING`
  );
  const getPersonId = db.prepare(`SELECT id FROM people WHERE name = ?`);
  const insertMeeting = db.prepare(
    `INSERT INTO meetings (date, title) VALUES (?, ?)`
  );
  const insertAttendance = db.prepare(
    `INSERT INTO attendance (meeting_id, person_id) VALUES (?, ?)`
  );

  const run = db.transaction((names: string[]) => {
    const meetingId = insertMeeting.run(body.date, title).lastInsertRowid as number;

    for (const name of names) {
      insertPerson.run(name);
      const person = getPersonId.get(name) as { id: number };
      insertAttendance.run(meetingId, person.id);
    }

    return meetingId;
  });

  const meetingId = run(names);

  return NextResponse.json({ id: meetingId, date: body.date, title, attendees: names }, { status: 201 });
}
