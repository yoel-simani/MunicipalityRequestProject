type Props = {
  level: string;
  onChange: (l: "nose" | "tatNose" | "sugPniya") => void;
};

export default function LevelSelector({ level, onChange }: Props) {
  return (
    <select
      value={level}
      onChange={(e) => onChange(e.target.value as any)}
      style={{ padding: "6px 8px", borderRadius: 6, border: "1px solid #ddd" }}
      aria-label="בחר רמת תבניות"
    >
      <option value="nose">נושאים</option>
      <option value="tatNose">תתי נושאים</option>
      <option value="sugPniya">סוגי פנייה</option>
    </select>
  );
}
