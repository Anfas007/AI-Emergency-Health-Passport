import { useState, useEffect } from "react";
import { fetchDashboardStats, fetchEnhancedAuditLogs } from "../services/api";

export default function HospitalHome({ onSelect, adminName }) {
  const [stats, setStats] = useState(null);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));

    const today = new Date().toISOString().slice(0, 10);
    fetchEnhancedAuditLogs({ date_from: today, date_to: today, limit: 50 })
      .then((data) => setFeed(data.logs || []))
      .catch(() => {})
      .finally(() => setFeedLoading(false));
  }, []);

  const fmt = (n) => (n != null ? n.toLocaleString() : "—");

  const formatTime = (ts) => {
    if (!ts) return "—";
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const buildEvent = (log) => {
    if (log.detail) return log.detail;
    const actor = log.actor_id || log.role || "Unknown";
    const patient = log.patient_id || "—";
    return `${actor} accessed Patient ${patient}`;
  };

  const typeBadge = (mode) => {
    if (!mode) return { cls: "badge-neutral", label: "Unknown" };
    const m = mode.toUpperCase();
    if (m === "EMERGENCY") return { cls: "badge-danger", label: "Emergency Override" };
    if (m === "QR_SCAN") return { cls: "badge-warning", label: "QR Scan" };
    if (m === "NORMAL_CONSULTATION") return { cls: "badge-info", label: "Consultation" };
    if (m === "NOTIFICATION") return { cls: "badge-success", label: "Notification" };
    return { cls: "badge-neutral", label: mode };
  };

  return (
    <div className="animate-fade-in">
      {/* Welcome Section */}
      <div style={{ marginBottom: 32 }}>
        <h2 className="page-title">Welcome back, {adminName} 👋</h2>
        <p className="page-subtitle">Here's an overview of your hospital management dashboard</p>
      </div>

      {/* Live KPI Cards */}
      <div className="kpi-grid">
        <KPICard
          icon="👨‍⚕️" iconBg="blue"
          value={loading ? "…" : fmt(stats?.total_doctors)}
          label="Registered Doctors"
          change="In your hospital"
        />
        <KPICard
          icon="👥" iconBg="green"
          value={loading ? "…" : fmt(stats?.total_patients)}
          label="Total Patients"
          change="All registered"
        />
        <KPICard
          icon="🚨" iconBg="red"
          value={loading ? "…" : fmt(stats?.emergency_scans_today)}
          label="Emergency Scans"
          change="Today"
        />
        <KPICard
          icon="🩺" iconBg="teal"
          value={loading ? "…" : fmt(stats?.consultations_today)}
          label="Consultations"
          change="Today"
        />
      </div>

      {/* Audit Activity Feed */}
      <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>
          📡 Audit Activity Feed
        </h3>
        <button
          onClick={() => onSelect("audit-compliance")}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: 12 }}
        >
          View All Logs →
        </button>
      </div>

      {feedLoading ? (
        <p className="text-muted loading-pulse" style={{ padding: 20 }}>Loading recent activity...</p>
      ) : feed.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📋</div>
          <p>No recent activity to display.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Event</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {feed.map((log, i) => {
                const badge = typeBadge(log.mode);
                return (
                  <tr key={i}>
                    <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{formatTime(log.timestamp)}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{formatDate(log.timestamp)}</div>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      {buildEvent(log)}
                    </td>
                    <td>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
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
