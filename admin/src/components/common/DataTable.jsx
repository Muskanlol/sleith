import { useState } from "react";
import Pagination from "./Pagination";

function DataTable({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyTitle = "No data found",
  emptyMessage = "There are no records to display.",
  error = null,
  onRetry = null,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  actions = null,
  sortable = false,
  onSort,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const handleSort = (key) => {
    if (!sortable || !onSort) return;
    const direction = sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc";
    setSortConfig({ key, direction });
    onSort(key, direction);
  };

  const getNestedValue = (obj, path) =>
    path.split(".").reduce((acc, part) => acc?.[part], obj);

  const renderCell = (item, column) => {
    const value = column.accessor
      ? getNestedValue(item, column.accessor)
      : item[column.key];
    if (column.render) return column.render(value, item);
    if (column.type === "date" && value) return new Date(value).toLocaleDateString();
    if (column.type === "datetime" && value) return new Date(value).toLocaleString();
    if (column.type === "currency" && value !== undefined) return `₹${value}`;
    return value || "-";
  };

  /* ── Shared wrapper ──────────────────────────────────────────────── */
  const Card = ({ children }) => (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)" }}
    >
      {children}
    </div>
  );

  /* ── Loading ─────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-16">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "var(--accent) transparent var(--accent) var(--accent)" }}
          />
        </div>
      </Card>
    );
  }

  /* ── Error ───────────────────────────────────────────────────────── */
  if (error) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: "rgba(239,68,68,0.1)" }}>
            <svg className="w-6 h-6" fill="none" stroke="#f87171" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Error</h3>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>{error}</p>
          {onRetry && (
            <button onClick={onRetry}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: "var(--hover-bg)", border: "1px solid var(--card-border)",
                color: "var(--text-primary)",
              }}>
              Try Again
            </button>
          )}
        </div>
      </Card>
    );
  }

  /* ── Empty ───────────────────────────────────────────────────────── */
  if (!data || data.length === 0) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: "var(--hover-bg)" }}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{ color: "var(--text-secondary)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>{emptyTitle}</h3>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{emptyMessage}</p>
        </div>
      </Card>
    );
  }

  /* ── Table ───────────────────────────────────────────────────────── */
  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--card-border)", background: "var(--hover-bg)" }}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 text-left text-[11px] font-semibold tracking-widest uppercase ${
                    sortable && col.sortable !== false ? "cursor-pointer" : ""
                  }`}
                  style={{ color: "var(--text-secondary)" }}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {sortable && col.sortable !== false && sortConfig.key === col.key && (
                      <span style={{ color: "var(--accent)" }}>
                        {sortConfig.direction === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-right text-[11px] font-semibold tracking-widest uppercase"
                  style={{ color: "var(--text-secondary)" }}>
                  Actions
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {data.map((item, index) => (
              <tr
                key={keyExtractor ? keyExtractor(item) : index}
                className="transition-colors"
                style={{ borderTop: "1px solid var(--card-border)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3.5 text-sm"
                    style={{ color: "var(--text-primary)" }}>
                    {renderCell(item, col)}
                  </td>
                ))}
                {actions && (
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">{actions(item)}</div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ borderTop: "1px solid var(--card-border)" }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </Card>
  );
}

export default DataTable;
