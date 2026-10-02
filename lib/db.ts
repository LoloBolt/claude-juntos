import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "attendance.db");

declare global {
  var __attendanceDb: Database.Database | undefined;
}

function createConnection(): Database.Database {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS people (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS meetings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'Weekly Meeting',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attendance (
      meeting_id INTEGER NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
      person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
      PRIMARY KEY (meeting_id, person_id)
    );

    CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
  `);

  return db;
}

export function getDb(): Database.Database {
  if (!global.__attendanceDb) {
    global.__attendanceDb = createConnection();
  }
  return global.__attendanceDb;
}

export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}
