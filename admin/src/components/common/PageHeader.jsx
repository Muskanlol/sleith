function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{
            color: "var(--text-primary)",
            fontFamily: "'Playfair Display', Georgia, serif",
          }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export default PageHeader;
