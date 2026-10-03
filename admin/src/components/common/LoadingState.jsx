function LoadingState({ message = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div
        className="w-9 h-9 rounded-full border-2 border-t-transparent animate-spin mb-4"
        style={{ borderColor: "var(--accent) transparent var(--accent) var(--accent)" }}
      />
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {message}
      </p>
    </div>
  );
}

export default LoadingState;
