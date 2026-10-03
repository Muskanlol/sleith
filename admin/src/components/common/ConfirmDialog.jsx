function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", isDanger = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
      <div
        className="w-full max-w-md rounded-2xl p-6"
        style={{
          background: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
        }}
      >
        <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{title}</h3>
        <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "var(--hover-bg)",
              border: "1px solid var(--card-border)",
              color: "var(--text-primary)",
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={isDanger
              ? { background: "rgba(239,68,68,0.1)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }
              : { background: "var(--accent)", color: "#0a0a0a", border: "1px solid transparent" }
            }
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;