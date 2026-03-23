import React, { useEffect, useRef, useState } from "react";
import type { AppDataResponse } from "../../models/Municipality";

type Props = {
  data: AppDataResponse | null;
  placeholder?: string;
  onSelect?: (item: any) => void;
};

export default function MenuSugPniyaSearch({ data, placeholder = "חפש סוג פנייה...", onSelect }: Props) {
  const options = data?.sugeyPniyotList ?? [];
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);

  const labelOf = (o: any) => o?.teurSugPniya ?? o?.name ?? o?.sugPniya ?? "";
  const filtered = options.filter(o => labelOf(o).toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  useEffect(() => setHighlight(0), [query, open]);

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(h => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[highlight];
      if (item) select(item);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function select(item: any) {
    onSelect?.(item);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="search-container" ref={ref} style={{ direction: "rtl" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button
          aria-label="open sug pniya"
          onClick={() => setOpen(v => !v)}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          ▾
        </button>
        <input
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          style={{ textAlign: "right" }}
        />
      </div>

      {open && (
        <div className="search-list" role="listbox">
          {filtered.length === 0 && <div className="search-item">לא נמצאו פריטים</div>}
          {filtered.map((o, i) => (
            <div
              key={i}
              role="option"
              aria-selected={i === highlight}
              tabIndex={0}
              className={i === highlight ? "search-item search-highlight" : "search-item"}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => select(o)}
            >
              {labelOf(o)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
