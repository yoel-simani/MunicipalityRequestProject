// components/TopNav.jsx
import React from "react";
import { NavLink } from "react-router-dom";

export default function TopNav() {
  return (
    <nav
      className="navbar navbar-expand-lg navbar-light bg-light mb-3"
      dir="rtl"
    >
      <div className="container-fluid">
        <span className="navbar-brand">🔧 מערכת ניהול</span>
        <div className="d-flex gap-3">
          <NavLink className="nav-link" to="/wf">
            תהליכים
          </NavLink>
          <NavLink className="nav-link" to="/logs">
            לוגים
          </NavLink>
          <NavLink className="nav-link" to="/settings">
            הגדרות
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
