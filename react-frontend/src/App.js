import React, { useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaClipboardList,
  FaFileAlt,
  FaCog,
} from "react-icons/fa";
import Logs from "./pages/Logs";
import WfProcInsts from "./pages/WfProcInsts";
import Settings from "./pages/Settings";
import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import { Navigate } from "react-router-dom";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div
      className="d-flex"
      dir="rtl"
      style={{ minHeight: "100vh", background: "#f8f9fa" }}
    >
      {/* Sidebar */}
      <nav
        className={`bg-white border-end shadow ${
          sidebarOpen ? "sidebar-open" : "sidebar-closed"
        }`}
        style={{
          width: sidebarOpen ? 250 : 60,
          transition: "width 0.3s",
          minHeight: "100vh",
          overflow: "hidden",
          position: "relative",
          zIndex: 1000,
        }}
      >
        {/* כפתור פתיחה/סגירה */}
        <button
          onClick={toggleSidebar}
          className="btn btn-outline-primary position-absolute top-0 start-0 m-2"
          style={{ transform: "translateX(100%)" }}
          aria-label={sidebarOpen ? "סגור תפריט" : "פתח תפריט"}
        >
          {sidebarOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* תוכן תפריט פתוח */}
        {sidebarOpen && (
          <>
            <h5 className="p-3 border-bottom">תפריט ניווט</h5>
            <ul className="nav flex-column px-2">
              <li className="nav-item my-2">
                <NavLink
                  to="/wf"
                  className={({ isActive }) =>
                    "nav-link d-flex align-items-center gap-2 " +
                    (isActive ? "active fw-bold text-primary" : "text-dark")
                  }
                >
                  <FaClipboardList />
                  <span>תהליכים (WfProcInsts)</span>
                </NavLink>
              </li>
              <li className="nav-item my-2">
                <NavLink
                  to="/logs"
                  className={({ isActive }) =>
                    "nav-link d-flex align-items-center gap-2 " +
                    (isActive ? "active fw-bold text-primary" : "text-dark")
                  }
                >
                  <FaFileAlt />
                  <span>לוגים (Logs)</span>
                </NavLink>
              </li>
              <li className="nav-item my-2">
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    "nav-link d-flex align-items-center gap-2 " +
                    (isActive ? "active fw-bold text-primary" : "text-dark")
                  }
                >
                  <FaCog />
                  <span>הגדרות</span>
                </NavLink>
              </li>
            </ul>
          </>
        )}

        {/* תפריט סגור – אייקונים בלבד */}
        {!sidebarOpen && (
          <ul className="nav flex-column text-center mt-5">
            <li className="nav-item my-3">
              <NavLink
                to="/wf"
                className={({ isActive }) =>
                  "nav-link " + (isActive ? "text-primary" : "text-secondary")
                }
                title="תהליכים"
              >
                <FaClipboardList size={24} />
              </NavLink>
            </li>
            <li className="nav-item my-3">
              <NavLink
                to="/logs"
                className={({ isActive }) =>
                  "nav-link " + (isActive ? "text-primary" : "text-secondary")
                }
                title="לוגים"
              >
                <FaFileAlt size={24} />
              </NavLink>
            </li>
            <li className="nav-item my-3">
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  "nav-link " + (isActive ? "text-primary" : "text-secondary")
                }
                title="הגדרות"
              >
                <FaCog size={24} />
              </NavLink>
            </li>
          </ul>
        )}
      </nav>

      {/* תוכן הדף */}
      <main
        className="flex-grow-1 p-4"
        style={{
          transition: "margin 0.3s",
          marginRight: sidebarOpen ? 0 : -190,
          minHeight: "100vh",
        }}
      >
        <Routes>
          <Route path="/" element={<Navigate to="/wf" replace />} />
          <Route path="/wf" element={<WfProcInsts />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
          <Route
            path="*"
            element={<h2 className="text-center mt-5">404 - הדף לא נמצא</h2>}
          />
        </Routes>
      </main>
    </div>
  );
}
