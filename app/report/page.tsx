"use client";

import { useEffect, useMemo, useState } from "react";

type ReportRow = {
  name: string;
  attendedMeetingIds: number[];
  attendedCount: number;
  totalMeetings: number;
  pct: number;
};

type Meeting = { id: number; date: string; title: string };

type ReportResponse = {
  year: number;
  month: number;
  meetings: Meeting[];
  rows: ReportRow[];
};

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(year: number, month: number) {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export default function ReportPage() {
  const [monthValue, setMonthValue] = useState(currentMonthValue());
  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [year, month] = useMemo(() => {
    const [y, m] = monthValue.split("-").map(Number);
    return [y, m];
  }, [monthValue]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/report?year=${year}&month=${month}`);
      const json = await res.json();
      if (!cancelled) {
        setData(json);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [year, month]);

  function downloadCsv() {
    if (!data) return;
    const header = ["Name", "Meetings Attended", "Total Meetings", "Attendance %"];
    const lines = [header.join(",")];
    for (const row of data.rows) {
      lines.push(
        [JSON.stringify(row.name), row.attendedCount, row.totalMeetings, row.pct].join(",")
      );
    }
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${year}-${String(month).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Monthly report</h1>
        <p className="mt-1 text-sm text-foreground/60">
          See who attended your weekly meetings during the selected month.
        </p>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="block text-sm font-medium mb-1.5">Month</span>
            <input
              type="month"
              value={monthValue}
              onChange={(e) => setMonthValue(e.target.value)}
              className="rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </label>
          <button
            onClick={downloadCsv}
            disabled={!data || data.rows.length === 0}
            className="rounded-lg border border-black/15 dark:border-white/20 px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            Download CSV
          </button>
        </div>
      </section>

      <section>
        {loading || !data ? (
          <p className="text-sm text-foreground/60">Loading…</p>
        ) : (
          <>
            <p className="text-sm text-foreground/60">
              {data.meetings.length} meeting{data.meetings.length === 1 ? "" : "s"} logged in{" "}
              {monthLabel(year, month)}
              {data.meetings.length > 0 && (
                <>
                  : {data.meetings.map((m) => new Date(`${m.date}T00:00:00`).getDate()).join(", ")}
                </>
              )}
            </p>

            {data.rows.length === 0 ? (
              <p className="mt-4 text-sm text-foreground/60">No attendance recorded yet for this month.</p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-lg border border-black/10 dark:border-white/15">
                <table className="w-full text-sm">
                  <thead className="bg-foreground/5 text-left">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Name</th>
                      <th className="px-4 py-2.5 font-medium text-right">Attended</th>
                      <th className="px-4 py-2.5 font-medium text-right">Of total</th>
                      <th className="px-4 py-2.5 font-medium w-36">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, i) => (
                      <tr
                        key={row.name}
                        className={i % 2 === 1 ? "bg-foreground/[0.02]" : undefined}
                      >
                        <td className="px-4 py-2.5">{row.name}</td>
                        <td className="px-4 py-2.5 text-right">{row.attendedCount}</td>
                        <td className="px-4 py-2.5 text-right text-foreground/60">
                          {row.totalMeetings}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 rounded-full bg-foreground/10 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-foreground"
                                style={{ width: `${row.pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-foreground/60 w-10 text-right">
                              {row.pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
