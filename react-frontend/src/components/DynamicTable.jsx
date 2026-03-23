import React, { useState, useMemo, Fragment, useEffect, useRef } from "react";
import { columnDefsByPage } from "../config/columnDefs";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { toast } from "react-toastify";
import {
  FaFileExcel,
  FaFileCsv,
  FaFileCode,
  FaSync,
  FaClipboard,
  FaFilter,
} from "react-icons/fa";
import Dropdown from "react-bootstrap/Dropdown";

export default function DynamicTable({
  pageKey,
  data,
  env,
  buildPniaLink,
  buildProcessLink,
}) {
  const columnDefs = columnDefsByPage[pageKey] || [];
  const [filters, setFilters] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    field: null,
    direction: null,
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);

  const [spinningIcon, setSpinningIcon] = useState("");
  const [spinType, setSpinType] = useState("");

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(0);
  };

  const handleSort = (field) => {
    setSortConfig((prev) => {
      if (prev.field === field) {
        if (prev.direction === "asc") return { field, direction: "desc" };
        if (prev.direction === "desc") return { field: null, direction: null };
      }
      return { field, direction: "asc" };
    });
  };

  const filteredData = useMemo(() => {
    let filtered = data.filter((row) =>
      columnDefs.every((col) => {
        const value = String(row[col.field] ?? "").toLowerCase();
        const filter = (filters[col.field] || "").toLowerCase();
        return value.includes(filter);
      })
    );

    if (sortConfig.field) {
      const dir = sortConfig.direction === "asc" ? 1 : -1;
      filtered.sort((a, b) => {
        const aVal = a[sortConfig.field] ?? "";
        const bVal = b[sortConfig.field] ?? "";
        return aVal > bVal ? dir : aVal < bVal ? -dir : 0;
      });
    }

    return filtered;
  }, [data, filters, columnDefs, sortConfig]);

  const paginatedData = useMemo(() => {
    if (pageSize === "all") return filteredData;
    const start = currentPage * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages =
    pageSize === "all" ? 1 : Math.ceil(filteredData.length / pageSize) || 1;

  // ייצוא
  const exportToExcel = () => {
    const MAX_LENGTH = 32767;
    const visibleFields = columnDefs.map((col) => col.field);
    const headersMap = columnDefs.reduce((acc, col) => {
      acc[col.field] = col.header;
      return acc;
    }, {});

    const cleanedData = filteredData.map((row) => {
      const newRow = {};
      visibleFields.forEach((field) => {
        let value = row[field];
        try {
          if (typeof value === "object" && value !== null) {
            value = JSON.stringify(value);
          } else {
            value = String(value ?? "");
          }
        } catch {
          value = "[Unserializable]";
        }
        if (value.length > MAX_LENGTH) {
          value = value.slice(0, MAX_LENGTH - 15) + "...[truncated]";
        }
        newRow[headersMap[field]] = value;
      });
      return newRow;
    });

    try {
      const worksheet = XLSX.utils.json_to_sheet(cleanedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
      const blob = new Blob([
        XLSX.write(workbook, { bookType: "xlsx", type: "array" }),
      ]);
      saveAs(blob, `${pageKey}_data.xlsx`);
    } catch (err) {
      toast.error("❌ שגיאה ביצירת Excel: " + err.message);
    }
  };

  const exportToCsv = () => {
    const visibleFields = columnDefs.map((col) => col.field);
    const headers = columnDefs.map((col) => col.header);

    const rows = filteredData.map((row) =>
      visibleFields
        .map((f) => `"${String(row[f] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${pageKey}_data.csv`);
  };

  const exportToJson = () => {
    const blob = new Blob([JSON.stringify(filteredData, null, 2)], {
      type: "application/json",
    });
    saveAs(blob, `${pageKey}_data.json`);
  };

  const handleCopyAll = () => {
    const allData = JSON.stringify(filteredData, null, 2);
    navigator.clipboard
      .writeText(allData)
      .then(() => toast.success("📋 כל הנתונים הועתקו ללוח!"))
      .catch(() => toast.error("❌ שגיאה בהעתקה"));
  };

  const handleCopyJson = (row) => {
    const fullJson = JSON.stringify(row, null, 2);
    navigator.clipboard
      .writeText(fullJson)
      .then(() => toast.success("📋 JSON הועתק ללוח!"))
      .catch(() => toast.error("❌ שגיאה בהעתקה"));
  };

  const withSpin = (iconName, action) => {
    setSpinningIcon(iconName);
    setSpinType("left-right");
    setTimeout(() => {
      setSpinningIcon("");
      setSpinType("");
    }, 800);
    action();
  };

  const prevDataLength = useRef(filteredData.length);

  useEffect(() => {
    if (prevDataLength.current !== filteredData.length) {
      setSpinningIcon("all");
      setSpinType("top-bottom");
      setTimeout(() => {
        setSpinningIcon("");
        setSpinType("");
      }, 200);
      prevDataLength.current = filteredData.length;
    }
  }, [filteredData.length]);

  return (
    <div className="p-3">
      {/* Toolbar */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="d-flex gap-2 align-items-center">
          {/* Dropdown ייצוא */}
          <Dropdown>
            <Dropdown.Toggle
              variant="light"
              className="border"
              style={{ padding: "4px 8px" }}
              disabled={filteredData.length === 0}
              title="ייצוא נתונים"
            >
              <FaFileExcel
                size={16}
                color={filteredData.length === 0 ? "#6c757d" : "green"}
                className={
                  ["excel", "all"].includes(spinningIcon)
                    ? spinType === "top-bottom"
                      ? "spin-top-bottom"
                      : "spin-left-right"
                    : ""
                }
              />
            </Dropdown.Toggle>

            <Dropdown.Menu align="end">
              <Dropdown.Item
                onClick={() => withSpin("excel", exportToExcel)}
                disabled={filteredData.length === 0}
              >
                <FaFileExcel className="me-2" /> ייצוא לאקסל
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => withSpin("csv", exportToCsv)}
                disabled={filteredData.length === 0}
              >
                <FaFileCsv className="me-2" /> ייצוא ל-CSV
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => withSpin("json", exportToJson)}
                disabled={filteredData.length === 0}
              >
                <FaFileCode className="me-2" /> ייצוא ל-JSON
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <button
            className="btn btn-light border"
            onClick={() => withSpin("refresh", () => window.location.reload())}
            disabled={filteredData.length === 0}
            title="רענון נתונים"
            style={{ padding: "4px 8px" }}
          >
            <FaSync
              size={16}
              color={filteredData.length === 0 ? "#6c757d" : "blue"}
              className={
                ["refresh", "all"].includes(spinningIcon)
                  ? spinType === "top-bottom"
                    ? "spin-top-bottom"
                    : "spin-left-right"
                  : ""
              }
            />
          </button>

          <button
            className="btn btn-light border"
            onClick={() => withSpin("copy", handleCopyAll)}
            disabled={filteredData.length === 0}
            title="העתק הכל ללוח"
            style={{ padding: "4px 8px" }}
          >
            <FaClipboard
              size={16}
              color={filteredData.length === 0 ? "#6c757d" : "#0dcaf0"}
              className={
                ["copy", "all"].includes(spinningIcon)
                  ? spinType === "top-bottom"
                    ? "spin-top-bottom"
                    : "spin-left-right"
                  : ""
              }
            />
          </button>

          <button
            className="btn btn-light border"
            onClick={() => withSpin("clear", () => setFilters({}))}
            disabled={filteredData.length === 0}
            title="נקה מסננים"
            style={{ padding: "4px 8px" }}
          >
            <FaFilter
              size={16}
              color={filteredData.length === 0 ? "#6c757d" : "#ffc107"}
              className={
                ["clear", "all"].includes(spinningIcon)
                  ? spinType === "top-bottom"
                    ? "spin-top-bottom"
                    : "spin-left-right"
                  : ""
              }
            />
          </button>
        </div>
      </div>

      {/* טבלה */}
      <div className="table-responsive">
        <table
          className="table table-hover table-bordered w-100"
          style={{ tableLayout: "fixed" }}
        >
          <thead className="table-light">
            <tr>
              {columnDefs.map((col) => (
                <th
                  key={col.field}
                  className="text-end"
                  style={{
                    cursor: col.sortable ? "pointer" : "default",
                    width: col.width || "auto",
                  }}
                  onClick={() => col.sortable && handleSort(col.field)}
                >
                  {col.header}
                  {sortConfig.field === col.field && (
                    <span className="ms-1">
                      {sortConfig.direction === "asc" ? "⬆️" : "⬇️"}
                    </span>
                  )}
                </th>
              ))}
            </tr>
            <tr>
              {columnDefs.map((col) => (
                <th
                  key={col.field}
                  className="text-end"
                  style={{ width: col.width || "auto" }}
                >
                  {col.filterable !== false && (
                    <input
                      type="text"
                      placeholder="חפש..."
                      value={filters[col.field] || ""}
                      onChange={(e) =>
                        handleFilterChange(col.field, e.target.value)
                      }
                      className="form-control form-control-sm"
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <Fragment
                  key={idx + currentPage * (pageSize === "all" ? 0 : pageSize)}
                >
                  <tr
                    onClick={() =>
                      setSelectedIndex(selectedIndex === idx ? null : idx)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    {columnDefs.map((col) => {
                      const cellValue = row[col.field];
                      const cellStyle = { width: col.width || "auto" };

                      if (col.type === "link") {
                        const link =
                          col.customLinkBuilder?.(
                            row,
                            env,
                            col.field === "pseq"
                              ? buildPniaLink
                              : buildProcessLink
                          ) ||
                          (col.linkBaseUrl
                            ? `${col.linkBaseUrl}${cellValue}`
                            : null);

                        return (
                          <td
                            key={col.field}
                            className="text-end"
                            style={cellStyle}
                          >
                            {link && link !== cellValue ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary text-decoration-underline"
                              >
                                {cellValue || ""}
                              </a>
                            ) : (
                              <span>{cellValue || ""}</span>
                            )}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={col.field}
                          className="text-end"
                          style={cellStyle}
                        >
                          {col.cellRenderer
                            ? col.cellRenderer({ value: cellValue, row })
                            : cellValue || "הסתיים"}
                        </td>
                      );
                    })}
                  </tr>

                  {selectedIndex === idx && (
                    <tr>
                      <td colSpan={columnDefs.length} style={{ padding: 0 }}>
                        <div style={{ maxWidth: "100%", overflowX: "auto" }}>
                          <div
                            style={{
                              direction: "ltr",
                              textAlign: "left",
                              borderTop: "1px solid #ccc",
                              padding: "1rem",
                              background: "#282c34",
                              fontSize: "0.85rem",
                              fontFamily: "monospace",
                              position: "relative",
                              maxHeight: "400px",
                              overflowY: "auto",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-word",
                              borderRadius: "4px",
                              border: "1px solid #ddd",
                            }}
                          >
                            <button
                              onClick={() => handleCopyJson(row)}
                              style={{
                                position: "absolute",
                                top: "0.5rem",
                                right: "0.5rem",
                                fontSize: "0.8rem",
                                padding: "0.3rem 0.6rem",
                                border: "none",
                                backgroundColor: "#007bff",
                                color: "white",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                            >
                              📋 העתק
                            </button>
                            <SyntaxHighlighter
                              language="json"
                              style={oneDark}
                              wrapLongLines
                              customStyle={{
                                margin: 0,
                                backgroundColor: "transparent",
                                maxWidth: "100%",
                                fontSize: "0.85rem",
                              }}
                            >
                              {JSON.stringify(
                                (() => {
                                  const trimmed = { ...row };
                                  if (trimmed.req?.content?.length > 500) {
                                    trimmed.req.content = "[...shortened...]";
                                  }
                                  return trimmed;
                                })(),
                                null,
                                2
                              )}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={columnDefs.length} className="text-center">
                  <div className="alert alert-info mb-0">
                    לא נמצאו רשומות להצגה
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* פג'ינציה */}
      <div className="d-flex justify-content-between align-items-center mt-2">
        <div className="d-flex align-items-center gap-2">
          <span>פריטים בעמוד:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const value =
                e.target.value === "all" ? "all" : Number(e.target.value);
              setPageSize(value);
              setCurrentPage(0);
            }}
            className="form-select"
            style={{ width: "auto" }}
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value="all">הצג הכל</option>
          </select>
          {pageSize !== "all" && (
            <small className="text-muted ms-2">
              {currentPage * pageSize + 1} -{" "}
              {Math.min((currentPage + 1) * pageSize, filteredData.length)} מתוך{" "}
              {filteredData.length}
            </small>
          )}
        </div>

        {pageSize !== "all" && (
          <div className="d-flex align-items-center gap-1">
            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage(totalPages - 1)}
            >
              ⏮
            </button>

            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage >= totalPages - 1}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              ◀
            </button>

            {Array.from({ length: totalPages }, (_, i) => i)
              .filter((p) => {
                const isNear = Math.abs(p - currentPage) <= 2;
                return p === 0 || p === totalPages - 1 || isNear;
              })
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("ellipsis");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "ellipsis" ? (
                  <span key={idx} className="px-2">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`btn btn-sm ${
                      currentPage === p
                        ? "btn-primary"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p + 1}
                  </button>
                )
              )}

            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ▶
            </button>

            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage === 0}
              onClick={() => setCurrentPage(0)}
            >
              ⏭
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
