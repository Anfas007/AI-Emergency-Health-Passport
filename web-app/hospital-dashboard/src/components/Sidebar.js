/**
 * Sidebar — Hospital Dashboard left navigation
 */
export default function Sidebar({ activeMode, onSelect, hospitalName }) {
  const nav = [
    { section: "Main" },
    { key: null, icon: "📊", label: "Dashboard Overview" },
    { section: "Management" },
    { key: "doctors", icon: "🏥", label: "Hospital Management" },
    { key: "patients", icon: "👥", label: "Patient Management" },
    { section: "Monitoring" },
    { key: "audit-compliance", icon: "📋", label: "Audit Logs & Compliance" },
    { section: "Settings" },
    { key: "profile", icon: "👤", label: "Hospital Profile" },
  ];

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">🏥</div>
        <div className="sidebar-brand-text">
          Emergency
          <small>Health Passport</small>
        </div>
      </div>

      {/* Hospital Name */}
      {hospitalName && (
        <div style={{
          padding: "12px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          fontSize: 12,
          color: "#94A3B8",
        }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, color: "#64748B" }}>
            Hospital
          </div>
          <div style={{ color: "#E2E8F0", fontWeight: 600, fontSize: 13 }}>
            {hospitalName}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        {nav.map((item, i) => {
          if (item.section) {
            return (
              <div key={`section-${i}`} className="sidebar-section-label">
                {item.section}
              </div>
            );
          }
          const isActive = activeMode === item.key;
          return (
            <button
              key={item.key ?? "home"}
              className={`sidebar-item${isActive ? " active" : ""}`}
              onClick={() => onSelect(item.key)}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5 }}>
          © 2026 AEHP Platform
          <br />
          <span style={{ color: "#64748B" }}>v2.0 — Healthcare Dashboard</span>
        </div>
      </div>
    </aside>
  );
}
