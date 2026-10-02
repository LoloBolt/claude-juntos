"use client";

import { useEffect, useState } from "react";
import AttendeeInput from "@/components/AttendeeInput";

type Meeting = {
  id: number;
  date: string;
  title: string;
  attendees: string[];
};

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Home() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [people, setPeople] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(todayISO());
  const [title, setTitle] = useState("Weekly Meeting");
  const [attendees, setAttendees] = useState<string[]>([]);

  async function loadData() {
    const [meetingsRes, peopleRes] = await Promise.all([
      fetch("/api/meetings"),
      fetch("/api/people"),
    ]);
    const meetingsJson = await meetingsRes.json();
    const peopleJson = await peopleRes.json();
    setMeetings(meetingsJson.meetings ?? []);
    setPeople(peopleJson.people ?? []);
    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      const [meetingsRes, peopleRes] = await Promise.all([
        fetch("/api/meetings"),
        fetch("/api/people"),
      ]);
      const meetingsJson = await meetingsRes.json();
      const peopleJson = await peopleRes.json();
      setMeetings(meetingsJson.meetings ?? []);
      setPeople(peopleJson.people ?? []);
      setLoading(false);
    }
    void init();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (attendees.length === 0) {
      setError("Add at least one attendee before saving.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, title, attendees }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save the meeting.");
      }
      setAttendees([]);
      setTitle("Weekly Meeting");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this meeting and its attendance record?")) return;
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Log a meeting</h1>
        <p className="mt-1 text-sm text-foreground/60">
          Enter the date and who showed up. It&apos;s saved automatically.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium mb-1.5">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1.5">Title</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Weekly Meeting"
                className="w-full rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Attendees</span>
            <AttendeeInput value={attendees} onChange={setAttendees} suggestions={people} />
          </label>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save meeting"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold tracking-tight">Recent meetings</h2>

        {loading ? (
          <p className="mt-4 text-sm text-foreground/60">Loading…</p>
        ) : meetings.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/60">No meetings logged yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {meetings.map((m) => (
              <li
                key={m.id}
                className="rounded-lg border border-black/10 dark:border-white/15 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-sm text-foreground/60">{formatDate(m.date)}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-sm text-foreground/50 hover:text-red-600 dark:hover:text-red-400"
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.attendees.length === 0 ? (
                    <span className="text-sm text-foreground/40">No attendees recorded</span>
                  ) : (
                    m.attendees.map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-foreground/10 px-3 py-1 text-xs"
                      >
                        {name}
                      </span>
                    ))
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
