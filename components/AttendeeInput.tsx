"use client";

import { useMemo, useState } from "react";

type Props = {
  value: string[];
  onChange: (names: string[]) => void;
  suggestions: string[];
};

export default function AttendeeInput({ value, onChange, suggestions }: Props) {
  const [draft, setDraft] = useState("");
  const [focused, setFocused] = useState(false);

  const filteredSuggestions = useMemo(() => {
    const lowerValue = new Set(value.map((v) => v.toLowerCase()));
    const query = draft.trim().toLowerCase();
    return suggestions
      .filter((name) => !lowerValue.has(name.toLowerCase()))
      .filter((name) => (query ? name.toLowerCase().includes(query) : true))
      .slice(0, 6);
  }, [draft, suggestions, value]);

  function addName(raw: string) {
    const name = raw.trim().replace(/\s+/g, " ");
    if (!name) return;
    const exists = value.some((v) => v.toLowerCase() === name.toLowerCase());
    if (!exists) onChange([...value, name]);
    setDraft("");
  }

  function removeName(name: string) {
    onChange(value.filter((v) => v !== name));
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 rounded-lg border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 min-h-[3rem] focus-within:ring-2 focus-within:ring-foreground/20">
        {value.map((name) => (
          <span
            key={name}
            className="flex items-center gap-1.5 rounded-full bg-foreground/10 pl-3 pr-1.5 py-1 text-sm"
          >
            {name}
            <button
              type="button"
              onClick={() => removeName(name)}
              aria-label={`Remove ${name}`}
              className="rounded-full w-5 h-5 flex items-center justify-center text-foreground/60 hover:bg-foreground/20 hover:text-foreground"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 100)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              addName(draft);
            } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
              removeName(value[value.length - 1]);
            }
          }}
          placeholder={value.length === 0 ? "Type a name and press Enter" : "Add another…"}
          className="flex-1 min-w-[10ch] bg-transparent outline-none text-sm py-1"
        />
      </div>

      {focused && filteredSuggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-black/10 dark:border-white/15 bg-background shadow-lg overflow-hidden">
          {filteredSuggestions.map((name) => (
            <li key={name}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addName(name);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-foreground/10"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
