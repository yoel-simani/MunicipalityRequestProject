// components/AppLayout.jsx
import React from "react";

const AppLayout = ({ title, children }) => {
  return (
    <div className="container mt-4" dir="rtl">
      <h2 className="mb-4">{title}</h2>
      {children}
    </div>
  );
};

export default AppLayout;
