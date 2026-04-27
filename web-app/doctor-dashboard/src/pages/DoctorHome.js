import { useEffect, useState } from "react";
import { fetchEmergencyLogs } from "../services/api";
import { formatLocalDateTime, formatLocalTime, parseUtcToLocalDate } from "../utils/time";

export default function DoctorHome({ onSelect, doctorName, hospitalName, hospitalCode, multiHospital, onSwitchHospital, onLogout }) {
  const menuItems = [
    { key: null, label: "Dashboard", icon: "dashboard" },
    { key: "emergency", label: "Emergency Consultation", icon: "emergency" },
    { key: "normal", label: "Normal Consultation", icon: "stethoscope" },
    { key: "records", label: "Manage Records", icon: "description" },
    { key: "logs", label: "Emergency Logs", icon: "history" },
    { key: "profile", label: "Profile", icon: "person" },
  ];

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoadingLogs(true);
      try {
        const res = await fetchEmergencyLogs();
        setLogs(Array.isArray(res?.logs) ? res.logs : []);
      } catch {
        setLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    };

    loadDashboardData();
  }, []);

  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  const isConsultMode = (mode) => mode === "EMERGENCY" || mode === "NORMAL_CONSULTATION";

  const recentLogs = logs.filter((l) => {
    const dt = parseUtcToLocalDate(l?.timestamp);
    return dt && dt >= sevenDaysAgo;
  });
  const recentConsultLogs = recentLogs.filter((l) => isConsultMode(l.mode));
  const totalConsultLogs = logs.filter((l) => isConsultMode(l.mode));

  const todayLogs = logs.filter((l) => {
    if (!l?.timestamp) return false;
    const dt = parseUtcToLocalDate(l.timestamp);
    if (!dt) return false;
    return (
      dt.getFullYear() === now.getFullYear() &&
      dt.getMonth() === now.getMonth() &&
      dt.getDate() === now.getDate()
    );
  });
  const todayConsults = todayLogs.filter((l) => isConsultMode(l.mode));

  const totalConsultationsAllTime = totalConsultLogs.length;
  const emergencyConsulted = recentConsultLogs.filter((l) => l.mode === "EMERGENCY").length;
  const normalConsulted = recentConsultLogs.filter((l) => l.mode === "NORMAL_CONSULTATION").length;

  const topCards = [
    {
      title: "Total Consultations",
      value: String(totalConsultationsAllTime),
      note: "All-time",
      tone: "hpd-card-primary",
      icon: "groups",
    },
    {
      title: "Emergency Consulted",
      value: String(emergencyConsulted),
      note: "From audit logs",
      tone: "hpd-card-emergency",
      icon: "local_hospital",
    },
    {
      title: "Normal Consulted",
      value: String(normalConsulted),
      note: "From audit logs",
      tone: "hpd-card-normal",
      icon: "monitor_heart",
    },
  ];

  const modeToIcon = (mode) => {
    if (mode === "EMERGENCY") return "emergency";
    if (mode === "NORMAL_CONSULTATION") return "monitor_heart";
    if (mode === "CONSENT_BLOCKED") return "warning";
    if (mode === "NOTIFICATION") return "notifications";
    return "history";
  };

  const modeToText = (log) => {
    const patient = log?.patient_id ? `patient ${log.patient_id}` : "patient";
    if (log?.mode === "EMERGENCY") return `Emergency access recorded for ${patient}`;
    if (log?.mode === "NORMAL_CONSULTATION") return `Normal consultation access recorded for ${patient}`;
    if (log?.mode === "CONSENT_BLOCKED") return `Consent blocked while accessing ${patient}`;
    if (log?.mode === "NOTIFICATION") return `Notification event logged for ${patient}`;
    return log?.detail || `Activity logged for ${patient}`;
  };

  const activity = logs.slice(0, 6).map((item) => ({
      icon: modeToIcon(item.mode),
      text: modeToText(item),
      time: item.timestamp ? formatLocalTime(item.timestamp) : "-",
    }));

  const displayHospital = hospitalName || hospitalCode || "No Hospital Selected";

  return (
    <div className="hpd-shell animate-slide-up">
      <aside className="hpd-sidebar">
        <div>
          <div className="hpd-logo">
            <div className="hpd-logo-mark"><Icon name="health_and_safety" /></div>
            <div>
              <div className="hpd-logo-title">Health Passport</div>
              <div className="hpd-logo-sub">AI Emergency Health</div>
            </div>
          </div>

          <nav className="hpd-menu">
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`hpd-menu-item ${item.key === null ? "active" : ""}`}
                onClick={() => (item.key === null ? null : onSelect(item.key))}
              >
                <span className="hpd-menu-icon"><Icon name={item.icon} /></span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <button type="button" className="hpd-logout" onClick={onLogout}>
          Logout
        </button>
      </aside>

      <section className="hpd-main">
        

        <header className="hpd-header">
          <h2>Welcome back, {doctorName || "Doctor"}</h2>
          <p>
            Facility: <strong>{displayHospital}</strong>
            {multiHospital && (
              <button type="button" onClick={onSwitchHospital} className="hpd-link-btn">
                Switch
              </button>
            )}
          </p>
        </header>

        <div className="hpd-top-cards">
          {topCards.map((card) => (
            <article key={card.title} className={`hpd-stat-card ${card.tone}`}>
              <div className="hpd-icon-square"><Icon name={card.icon} /></div>
              <div className="hpd-stat-text">
                <div className="hpd-stat-title">{card.title}</div>
                <div className="hpd-stat-value">{card.value}</div>
                <div className="hpd-stat-note">{card.note}</div>
              </div>
            </article>
          ))}
        </div>

        <div className="hpd-mid-grid">
          <article className="hpd-panel">
            <h3>Today&apos;s Consultations</h3>
            <div className="hpd-consult-stats">
              <div>
                <span>Total</span>
                <strong>{todayConsults.length}</strong>
              </div>
              <div>
                <span>Emergency</span>
                <strong className="hpd-red">{todayConsults.filter((l) => l.mode === "EMERGENCY").length}</strong>
              </div>
              <div>
                <span>Normal</span>
                <strong className="hpd-cyan">{todayConsults.filter((l) => l.mode === "NORMAL_CONSULTATION").length}</strong>
              </div>
            </div>
          </article>

          <article className="hpd-panel">
            <h3>Quick Actions</h3>
            <div className="hpd-actions">
              <button type="button" className="hpd-btn hpd-btn-emergency" onClick={() => onSelect("emergency")}>
                Emergency Consultation
              </button>
              <button type="button" className="hpd-btn hpd-btn-normal" onClick={() => onSelect("normal")}>
                Normal Consultation
              </button>
            </div>
          </article>
        </div>

        <div className="hpd-bottom-grid">
          <article className="hpd-panel">
            <h3>Recent Activity</h3>
            <ul className="hpd-activity-list">
              {loadingLogs && <li><div className="hpd-activity-text"><div>Loading activity...</div></div></li>}
              {!loadingLogs && activity.length === 0 && <li><div className="hpd-activity-text"><div>No recent activity found.</div></div></li>}
              {!loadingLogs && activity.map((item) => (
                <li key={`${item.text}-${item.time}`}>
                  <div className="hpd-activity-icon"><Icon name={item.icon} /></div>
                  <div className="hpd-activity-text">
                    <div>{item.text}</div>
                    <small>{item.time}</small>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="hpd-panel">
            <h3>Summary</h3>
            <div className="hpd-summary-items">
              <div className="hpd-summary-row">
                <span className="hpd-summary-icon"><Icon name="favorite" /></span>
                <div>
                  <p>Audit Events</p>
                  <strong>{logs.length} total logged</strong>
                </div>
              </div>
              <div className="hpd-summary-row">
                <span className="hpd-summary-icon"><Icon name="warning" /></span>
                <div>
                  <p>Blocked Access</p>
                  <strong>{logs.filter((l) => l.mode === "CONSENT_BLOCKED").length} consent-blocked events</strong>
                </div>
              </div>
              <div className="hpd-summary-row">
                <span className="hpd-summary-icon"><Icon name="schedule" /></span>
                <div>
                  <p>Last Access</p>
                  <strong>{logs[0]?.timestamp ? formatLocalDateTime(logs[0].timestamp) : "No activity yet"}</strong>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

function Icon({ name }) {
  const paths = {
    dashboard: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z",
    emergency: "M12 2 1 21h22L12 2Zm1 15h-2v-2h2v2Zm0-4h-2V9h2v4Z",
    stethoscope: "M7 3v7a5 5 0 0 0 10 0V3h-2v7a3 3 0 0 1-6 0V3H7Zm12 7v3a4 4 0 0 1-4 4h-1v2h-2v2h2v-2h1a6 6 0 0 0 6-6v-3h-2Z",
    description: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm1 7V3.5L19.5 9H15ZM8 13h8v2H8v-2Zm0 4h8v2H8v-2Zm0-8h5v2H8V9Z",
    history: "M13 3a9 9 0 1 0 8.95 10h-2.02A7 7 0 1 1 13 5V3Zm-1 5v6l5 3 .9-1.5-4.4-2.5V8H12Z",
    person: "M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5Z",
    groups: "M16 11c1.66 0 2.99-1.57 2.99-3.5S17.66 4 16 4s-3 1.57-3 3.5S14.34 11 16 11ZM8 11c1.66 0 2.99-1.57 2.99-3.5S9.66 4 8 4 5 5.57 5 7.5 6.34 11 8 11Zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5C15 14.17 10.33 13 8 13Zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5Z",
    local_hospital: "M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm-2 10h-3v3h-4v-3H7V9h3V6h4v3h3v4Z",
    monitor_heart: "M4 5h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-5l-2.2 3h-1.6L9 17H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm2 6h2l1.5-2.5L12 14l2-3h4",
    check_circle: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1 14-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6Z",
    notifications: "M12 22a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 22Zm6-6V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z",
    favorite: "M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4C8.24 4 9.91 4.81 11 6.08 12.09 4.81 13.76 4 15.5 4A4.5 4.5 0 0 1 20 8.5c0 3.78-3.4 6.86-8.55 11.5L12 21.35Z",
    warning: "M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z",
    schedule: "M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm1 11h-5V7h2v4h3v2Z",
    health_and_safety: "M12 2 4 5v6c0 5.25 3.44 10.2 8 11.66C16.56 21.2 20 16.25 20 11V5l-8-3Zm4 11h-3v3h-2v-3H8v-2h3V8h2v3h3v2Z",
    search: "M15.5 14h-.79l-.28-.27A6.5 6.5 0 1 0 14 15.5l.27.28v.79L20 22l2-2-6.5-6Zm-6 0A4.5 4.5 0 1 1 10 5a4.5 4.5 0 0 1-.5 9Z",
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={paths[name] || paths.dashboard} />
    </svg>
  );
}
