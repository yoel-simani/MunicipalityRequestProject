import "./MenuGrid.css";

type Props = {
  items: any[];
  columns?: number;
  onSelect?: (item: any) => void;
};

export default function MenuGrid({ items, columns = 3, onSelect }: Props) {
  return (
    <div className="menu-grid" style={{ ['--cols' as any]: columns }}>
      {items && items.length ? (
        items.map(item => {
          const key = item.noseId || item.sugPniya || item.id;
          const title = item.teurSugPniya || item.shemNose || item.name;
          const subtitle = item.toer || item.description || '';
          return (
            <div
              key={key}
              className="menu-card"
              role="button"
              tabIndex={0}
              onClick={() => onSelect?.(item)}
              onKeyPress={(e) => { if (e.key === 'Enter') onSelect?.(item); }}
            >
              <div style={{flex:1}}>
                <div className="title">{title}</div>
                {subtitle ? <div className="subtitle">{subtitle}</div> : null}
              </div>
            </div>
          );
        })
      ) : (
        <div className="menu-empty">אין פריטים להצגה</div>
      )}
    </div>
  );
}
