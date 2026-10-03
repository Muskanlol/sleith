function ErrorState({ message = "Something went wrong", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
        style={{ background: "rgba(239,68,68,0.1)" }}
      >
        <svg className="w-7 h-7" fill="none" stroke="#f87171" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
        Something went wrong
      </h3>
      <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-5 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: "var(--hover-bg)",
            border: "1px solid var(--card-border)",
            color: "var(--text-primary)",
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
