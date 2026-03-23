// pages/Settings.jsx
import React from "react";
import TopNav from "../components/TopNav";
import AppLayout from "../components/AppLayout";
import { ToastContainer } from "react-toastify";

export default function Settings() {
  return (
    <>
      <TopNav />
      <AppLayout title="⚙️ הגדרות מערכת">
        <p>כאן ניתן להגדיר פרמטרים כלליים, משתמשים, או תצורת סביבה בעתיד.</p>
        <p className="text-muted">המסך עדיין בפיתוח.</p>
        <ToastContainer position="top-center" />
      </AppLayout>
    </>
  );
}
