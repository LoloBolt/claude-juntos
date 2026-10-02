import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(request: NextRequest) {
  const db = getDb();
  const now = new Date();
  const year = Number(request.nextUrl.searchParams.get("year") ?? now.getFullYear());
  const month = Number(request.nextUrl.searchParams.get("month") ?? now.getMonth() + 1);

  const prefix = `${year}-${String(month).padStart(2, "0")}`;

  const meetings = db
    .prepare(
      `SELECT id, date, title FROM meetings WHERE date LIKE ? ORDER BY date ASC, id ASC`
    )
    .all(`${prefix}%`) as { id: number; date: string; title: string }[];

  const meetingIds = meetings.map((m) => m.id);

  type AttendanceRow = { name: string; meeting_id: number };
  let attendanceRows: AttendanceRow[] = [];

  if (meetingIds.length > 0) {
    const placeholders = meetingIds.map(() => "?").join(",");
    attendanceRows = db
      .prepare(
        `SELECT p.name AS name, a.meeting_id AS meeting_id
         FROM attendance a
         JOIN people p ON p.id = a.person_id
         WHERE a.meeting_id IN (${placeholders})`
      )
      .all(...meetingIds) as AttendanceRow[];
  }

  const byPerson = new Map<string, Set<number>>();
  for (const row of attendanceRows) {
    if (!byPerson.has(row.name)) byPerson.set(row.name, new Set());
    byPerson.get(row.name)!.add(row.meeting_id);
  }

  const totalMeetings = meetings.length;
  const rows = Array.from(byPerson.entries())
    .map(([name, idSet]) => ({
      name,
      attendedMeetingIds: Array.from(idSet),
      attendedCount: idSet.size,
      totalMeetings,
      pct: totalMeetings > 0 ? Math.round((idSet.size / totalMeetings) * 100) : 0,
    }))
    .sort((a, b) => b.attendedCount - a.attendedCount || a.name.localeCompare(b.name));

  return NextResponse.json({ year, month, meetings, rows });
}
