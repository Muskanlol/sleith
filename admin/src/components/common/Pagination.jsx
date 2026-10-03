function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: "var(--hover-bg)", color: "var(--text-secondary)" }}
        >
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={
              page === currentPage
                ? { background: "var(--accent)", color: "#0a0a0a" }
                : { background: "var(--hover-bg)", color: "var(--text-secondary)" }
            }
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: "var(--hover-bg)", color: "var(--text-secondary)" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
