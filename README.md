# Juntos — Meeting Attendance Tracker

A small, clean app for tracking who joins your weekly meetings and reviewing attendance by month.

## Features

- Log a meeting with a date, title, and the names of attendees (type-ahead on previously used names).
- Attendance is stored in a local SQLite database (`data/attendance.db`, created automatically).
- Monthly report showing each person's attendance count and rate for the selected month, with CSV export.
- Delete a logged meeting if it was entered by mistake.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The database file is created at `data/attendance.db` the first time you save a meeting; it's not tracked in git.

## Tech

Next.js (App Router) + TypeScript + Tailwind CSS, with `better-sqlite3` for storage. No external services required.

## Project structure

- `lib/db.ts` — SQLite connection and schema (`people`, `meetings`, `attendance`).
- `app/api/*` — REST endpoints for meetings, people, and the monthly report.
- `app/page.tsx` — log a meeting / browse recent meetings.
- `app/report/page.tsx` — monthly attendance report.
- `components/AttendeeInput.tsx` — tag-style name entry with autocomplete.
