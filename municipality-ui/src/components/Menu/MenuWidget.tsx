import { useState, useRef, useEffect } from "react";
import "./MenuWidget.css";
import type { AppDataResponse } from "../../models/Municipality";

interface MenuWidgetProps {
  data: AppDataResponse | null;
  onSelect: (item: any) => void;
  level: Level;
  nose: any;
  tatNose: any;
  history: any[];
  historyIndex: number;
  onLevelChange: (l: Level) => void;
  onNoseChange: (n: any) => void;
  onTatNoseChange: (t: any) => void;
  onHistoryChange: (h: any[]) => void;
  onHistoryIndexChange: (i: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onGoBack: () => void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onGoForward: () => void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onGoTo: (levelName: Level) => void;
}

type Level = "nose" | "tatNose" | "sugPniya";

export default function MenuWidget({
  data,
  onSelect,
  level,
  nose,
  tatNose,
  history,
  historyIndex,
  onLevelChange,
  onNoseChange,
  onTatNoseChange,
  onHistoryChange,
  onHistoryIndexChange,
  onGoBack: _onGoBack,
  onGoForward: _onGoForward,
  onGoTo: _onGoTo
}: MenuWidgetProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      // Show all items when empty
      const allResults: any[] = [];
      if (data?.noseimList) {
        allResults.push(...data.noseimList.map((item: any) => ({ ...item, type: 'nose' })));
      }
      if (data?.TateyNoseimList) {
        allResults.push(...data.TateyNoseimList.map((item: any) => ({ ...item, type: 'tatNose' })));
      }
      if (data?.sugeyPniyotList) {
        allResults.push(...data.sugeyPniyotList.map((item: any) => ({ ...item, type: 'sugPniya' })));
      }
      setSearchResults(allResults.slice(0, 20)); // Limit to 20 results
      setShowDropdown(allResults.length > 0);
      return;
    }

    // Search across all levels
    const results: any[] = [];
    if (data?.noseimList) {
      results.push(...data.noseimList.filter((item: any) =>
        item.shemNose?.toLowerCase().includes(value.toLowerCase()) ||
        item.teur?.toLowerCase().includes(value.toLowerCase())
      ).map((item: any) => ({ ...item, type: 'nose' })));
    }
    if (data?.TateyNoseimList) {
      results.push(...data.TateyNoseimList.filter((item: any) =>
        item.shemNose?.toLowerCase().includes(value.toLowerCase()) ||
        item.teur?.toLowerCase().includes(value.toLowerCase())
      ).map((item: any) => ({ ...item, type: 'tatNose' })));
    }
    if (data?.sugeyPniyotList) {
      results.push(...data.sugeyPniyotList.filter((item: any) =>
        item.teurSugPniya?.toLowerCase().includes(value.toLowerCase()) ||
        item.explanation?.toLowerCase().includes(value.toLowerCase())
      ).map((item: any) => ({ ...item, type: 'sugPniya' })));
    }

    setSearchResults(results.slice(0, 10)); // Limit to 10 results
    setShowDropdown(results.length > 0);
  };

  const handleItemClick = (item: any) => {
    let newState: any = null;
    if (level === "nose") {
      newState = { level: "tatNose", nose: item, tatNose: null };
    } else if (level === "tatNose") {
      newState = { level: "sugPniya", nose, tatNose: item };
    } else {
      onSelect(item);
      return;
    }
    // truncate forward history and push
    const next = history.slice(0, historyIndex + 1);
    next.push(newState);
    onHistoryChange(next);
    onHistoryIndexChange(next.length - 1);
    applyHistoryState(newState);
  };

  const applyHistoryState = (s: any) => {
    onLevelChange(s.level);
    onNoseChange(s.nose ?? null);
    onTatNoseChange(s.tatNose ?? null);
  };

  const triggerBack = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      onHistoryIndexChange(idx);
      applyHistoryState(history[idx]);
    }
  };

  let items: any[] = [];
  if (level === "nose") items = data?.noseimList ?? [];
  if (level === "tatNose")
    items = data?.TateyNoseimList?.filter(
      (t: any) => t.noseAv == (nose?.noseId ?? null)
    ) ?? [];
  if (level === "sugPniya")
    items = data?.sugeyPniyotList?.filter(
      (s: any) => s.nose == (nose?.noseId ?? null) && s.tatNose == (tatNose?.noseId ?? null)
    ) ?? [];

  // build breadcrumbs
  const crumbs: any[] = [
    { label: "נושאים", onClick: () => goTo("nose"), active: level === "nose" },
  ];
  if (nose) crumbs.push({ label: nose.shemNose || nose.name || "-", onClick: () => goTo("tatNose"), active: level === "tatNose" || level === "sugPniya" });
  if (tatNose) crumbs.push({ label: tatNose.teurSugPniya || tatNose.shemNose || tatNose.name || "-", onClick: () => goTo("sugPniya"), active: level === "sugPniya" });

  function goTo(levelName: Level) {
    const state = { level: levelName, nose: levelName === "nose" ? null : nose, tatNose: levelName === "sugPniya" ? tatNose : null };
    const next = history.slice(0, historyIndex + 1);
    next.push(state);
    onHistoryChange(next);
    onHistoryIndexChange(next.length - 1);
    applyHistoryState(state);
  }

  return (
    <div className="main-wrapper" dir="rtl" lang="he">
      <div className="search-container">
        <div className="main-title">באיזה נושא תרצה לטפל?</div>
        <div className="search-wrapper" ref={searchWrapperRef}>
          <input
            type="text"
            id="menu-search"
            placeholder="חפש נושא לטיפול..."
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            onFocus={() => handleSearchInput(searchQuery)}
            autoComplete="off"
          />
          <span className="search-icon arrow-icon" onClick={() => document.getElementById('menu-search')?.focus()}>▼</span>

          {showDropdown && (
            <div id="search-results" className="search-dropdown">
              {searchResults.map((item, index) => (
                <div key={index} className="search-item" onClick={() => handleItemClick(item)}>
                  {item.shemNose || item.teurSugPniya || item.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {crumbs.length > 1 && (
        <div id="menu-header" className="nav-bar">
          <div id="breadcrumb-text" className="b-text">
            {crumbs.map((c, i) => (
              <span key={i}>
                <button
                  onClick={c.onClick}
                  disabled={!c.onClick}
                  style={{
                    background: "none",
                    border: "none",
                    color: c.active ? "#222" : "#0078d4",
                    cursor: c.onClick ? "pointer" : "default",
                    fontWeight: c.active ? 700 : 500,
                    padding: 0,
                    margin: 0,
                  }}
                >
                  {c.label}
                </button>
                {i < crumbs.length - 1 && <span style={{ margin: "0 6px", color: "#999" }}>›</span>}
              </span>
            ))}
          </div>
          <div className="back-link" onClick={triggerBack}>
            <span id="back-button-text">חזור</span>
          </div>
        </div>
      )}

      <div id="menu-grid" className="menu-grid">
        {items.map((item, index) => (
          <div key={index} className="menu-item" onClick={() => handleItemClick(item)}>
            <div className="icon-circle">
              <svg className="item-svg" viewBox="0 0 24 24" width="35" height="35" fill="none" stroke="#6a1b9a" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="item-label">{item.shemNose || item.teurSugPniya || item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}