import { useLocation, useNavigate } from "react-router-dom";

export default function IdentificationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const item = location.state?.item;
  const municipalityId = location.state?.municipalityId;

  if (!item) {
    return <div>לא נבחרה תבנית</div>;
  }

  const handleBack = () => {
    navigate(`/${municipalityId}`, { state: { reset: true } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    alert("הטופס נשלח!");
  };

  return (
    <div dir="rtl" lang="he" style={{ padding: '10px 12px 20px', maxWidth: 750, marginInlineStart: 0, marginInlineEnd: 'auto', boxSizing: 'border-box' }}>
      <h1 style={{ marginTop: 0, marginBottom: 6 }}>הזדהות</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        <div>
          <label htmlFor="field1" style={{ display: "block", marginBottom: 5, fontWeight: "normal" }}>
            {item.koteretMeshalem || "שדה 1"}
          </label>
          <input
            type="text"
            id="field1"
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 4 }}
            required
          />
        </div>

        <div>
          <label htmlFor="field2" style={{ display: "block", marginBottom: 5, fontWeight: "normal" }}>
            {item.koteretPhizi || "שדה 2"}
          </label>
          <input
            type="text"
            id="field2"
            style={{ width: "100%", padding: 10, border: "1px solid #ccc", borderRadius: 4 }}
            required
          />
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={handleBack}
            style={{
              padding: "8px 16px",
              backgroundColor: "#0078d4",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
              flex: 1
            }}
          >
            אחורה
          </button>

          <button
            type="submit"
            style={{
              padding: "8px 16px",
              backgroundColor: "#0078d4",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
              flex: 1
            }}
          >
            קדימה
          </button>
        </div>
      </form>
    </div>
  );
}