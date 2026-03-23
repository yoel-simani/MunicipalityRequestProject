import React, { useEffect, useState } from "react";
import DynamicTable from "../components/DynamicTable";

export default function Pniot() {
  const [data, setData] = useState([]);

  useEffect(() => {
    // קריאה לשרת או נתוני דמה
    setData([
      { id: 1, subject: "שאלה על שירות", date: "2025-07-27T13:00:00Z" },
      { id: 2, subject: "בעיה בהתחברות", date: "2025-07-26T09:15:00Z" },
    ]);
  }, []);

  return (
    <div>
      <h2 className="mb-3">רשימת פניות</h2>
      <DynamicTable
        pageKey="pniot"
        data={data}
        env={"dev"}
        buildPniaLink={(pseq) => `/pnia/${pseq}`}
        buildProcessLink={(pid) => `/process/${pid}`}
      />
    </div>
  );
}
