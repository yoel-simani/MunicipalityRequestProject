type Crumb = { label: string; onClick?: () => void; active?: boolean };

export default function MenuBreadcrumb({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav
      aria-label="breadcrumb"
      style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", direction: "rtl" }}
    >
      {crumbs.map((c, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center" }}>
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
            }}
          >
            {c.label}
          </button>
          {i < crumbs.length - 1 && <span style={{ margin: "0 6px", color: "#999" }}>›</span>}
        </span>
      ))}
    </nav>
  );
}
