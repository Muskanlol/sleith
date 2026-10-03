import { useState } from "react";

function FilterBar({ searchPlaceholder = "Search...", onSearch, filters = [], onFilterChange }) {
  const [searchValue, setSearchValue] = useState("");

  const inputStyle = {
    background: "var(--hover-bg)",
    border: "1px solid var(--card-border)",
    color: "var(--text-primary)",
    borderRadius: "0.625rem",
    padding: "0.5rem 0.875rem 0.5rem 2.5rem",
    fontSize: "0.875rem",
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s",
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-md">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
          style={{ color: "var(--text-secondary)" }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => { setSearchValue(e.target.value); onSearch?.(e.target.value); }}
          placeholder={searchPlaceholder}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")}
        />
      </div>

      {/* Filter selects */}
      {filters.map((filter, i) => (
        <select
          key={i}
          value={filter.value}
          onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
          style={{
            background: "var(--hover-bg)",
            border: "1px solid var(--card-border)",
            color: "var(--text-primary)",
            borderRadius: "0.625rem",
            padding: "0.5rem 0.75rem",
            fontSize: "0.875rem",
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--card-border)")}
        >
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value} style={{ background: "var(--card-bg)" }}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}

export default FilterBar;
