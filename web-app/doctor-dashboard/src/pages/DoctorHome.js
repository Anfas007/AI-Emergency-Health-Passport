export default function DoctorHome({ onSelect, doctorName, hospitalName, hospitalCode, multiHospital, onSwitchHospital }) {
  const cards = [
    {
      icon: "🩺", title: "Normal Consultation",
      desc: "Routine patient visits — symptoms, diagnosis & prescription",
      accent: "var(--primary)", iconBg: "var(--primary-light)",
      key: "normal",
    },
    {
      icon: "📋", title: "Manage Records",
      desc: "View and update patient medical records with consent",
      accent: "var(--success)", iconBg: "var(--success-light)",
      key: "records",
    },
    {
      icon: "📝", title: "Emergency Logs",
      desc: "Your personal emergency access audit trail",
      accent: "#475569", iconBg: "#F1F5F9",
      key: "logs",
    },
  ];

  return (
    <div className="animate-slide-up">
      {/* Welcome Section */}
      <div style={{ marginBottom: 28 }}>
        <h2 className="page-title">
          {doctorName ? `Welcome back, ${doctorName}` : "Doctor Dashboard"}
        </h2>
        <p className="page-subtitle" style={{ marginBottom: 0 }}>
          What would you like to do today?
        </p>
      </div>

      {/* Action Grid */}
      <div className="action-grid">
        {cards.map(c => (
          <button
            key={c.key}
            className="action-card"
            onClick={() => onSelect(c.key)}
            style={{ "--card-accent": c.accent, border: "1px solid var(--border)" }}
          >
            <div className="action-card-icon" style={{ background: c.iconBg }}>
              {c.icon}
            </div>
            <div className="action-card-title" style={{ color: c.accent }}>{c.title}</div>
            <div className="action-card-desc">{c.desc}</div>
            <span className="action-card-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}
