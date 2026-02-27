export default function HospitalHome({ onSelect, adminName }) {
  const cards = [
    { key: "doctors", icon: "👨‍⚕️", label: "Doctor Management", desc: "Register, verify & assign doctors to your hospital", color: "#EFF6FF" },
    { key: "departments", icon: "🏢", label: "Department Management", desc: "Create, update & organize hospital departments", color: "#F0FDFA" },
    { key: "record-access", icon: "🔍", label: "Record Access Monitor", desc: "Track who accessed patient records and when", color: "#ECFDF5" },
    { key: "audit-logs", icon: "📋", label: "Emergency Access Logs", desc: "View full emergency access audit trail", color: "#FFFBEB" },
    { key: "compliance", icon: "📊", label: "Compliance & Reports", desc: "Generate compliance summary and analytics reports", color: "#F5F3FF" },
    { key: "profile", icon: "👤", label: "Hospital Profile", desc: "Manage your profile and account settings", color: "#FFF1F2" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Welcome Section */}
      <div style={{ marginBottom: 32 }}>
        <h2 className="page-title">Welcome back, {adminName} 👋</h2>
        <p className="page-subtitle">Here's an overview of your hospital management dashboard</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <KPICard icon="👨‍⚕️" iconBg="blue" value="—" label="Total Doctors" change="+2 this week" up />
        <KPICard icon="🏥" iconBg="green" value="—" label="Active Patients" change="Today" />
        <KPICard icon="🚨" iconBg="red" value="—" label="Emergencies Today" />
        <KPICard icon="🤖" iconBg="teal" value="—" label="AI Alerts" change="Last 24h" />
      </div>

      {/* Quick Navigation */}
      <div style={{ marginBottom: 8 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>
          Quick Actions
        </h3>
      </div>

      <div className="nav-grid">
        {cards.map(c => (
          <button key={c.key} className="nav-card" onClick={() => onSelect(c.key)}>
            <div className="nav-card-icon" style={{ background: c.color }}>
              <span style={{ fontSize: 26 }}>{c.icon}</span>
            </div>
            <div className="nav-card-title">{c.label}</div>
            <div className="nav-card-desc">{c.desc}</div>
            <span className="nav-card-arrow">→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function KPICard({ icon, iconBg, value, label, change, up }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${iconBg || ""}`}>
        <span>{icon}</span>
      </div>
      <div>
        <div className="kpi-value">{value}</div>
        <div className="kpi-label">{label}</div>
        {change && (
          <span className={`kpi-change ${up ? "up" : ""}`}>
            {up && "↑ "}{change}
          </span>
        )}
      </div>
    </div>
  );
}
