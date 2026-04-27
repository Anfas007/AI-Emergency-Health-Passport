import { useState, useEffect } from "react";
import { fetchEmergencyLogs } from "../services/api";
import { formatLocalDateTime } from "../utils/time";

function formatTime(value) {
  return formatLocalDateTime(value, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function accessLabel(mode) {
  switch (mode) {
    case "EMERGENCY":
      return "Emergency QR";
    case "NORMAL_CONSULTATION":
      return "Normal Consultation";
    case "CONSENT_BLOCKED":
      return "Consent Blocked";
    case "NOTIFICATION":
      return "Notification";
    default:
      return mode || "-";
  }
}

export default function EmergencyLogs({ onBack }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchEmergencyLogs();
      setLogs(result.logs || []);
    } catch (err) {
      setError(err.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logs-page">
      {/* Top Header */}
      <header className="emergency-header">
        <div className="emergency-header-left">
          <div className="emergency-header-title">Health Passport</div>
          <div className="emergency-header-subtitle">AI Emergency Health</div>
        </div>
        <button onClick={onBack} className="emergency-dashboard-btn">Dashboard</button>
      </header>

      {/* Main Content */}
      <main className="logs-main">
        <div className="logs-content">
          {/* Main Heading */}
          <div className="logs-heading-section">
            <h1 className="logs-main-title">Access Audit Logs</h1>
            <p className="logs-main-subtitle">
              Comprehensive audit trail showing who accessed patient data, when, and the access method used.
            </p>
          </div>

          {/* Refresh Button */}
          <div className="logs-actions-section">
            <button onClick={loadLogs} disabled={loading} className="logs-refresh-btn">
              {loading ? "Loading..." : "↻ Refresh Logs"}
            </button>
          </div>

          {/* Error Message */}
          {error && <div className="logs-error-banner">{error}</div>}

          {/* Empty State */}
          {!loading && logs.length === 0 && (
            <div className="logs-empty-state">
              <div className="logs-empty-icon">📋</div>
              <h3>No Access Logs Yet</h3>
              <p>Emergency access logs will appear here once patients are scanned or accessed.</p>
            </div>
          )}

          {/* Logs Table */}
          {logs.length > 0 && (
            <div className="logs-table-card">
              <div className="logs-table-container">
                <table className="logs-table">
                  <thead className="logs-table-header">
                    <tr>
                      <th className="logs-th">Time</th>
                      <th className="logs-th">Patient ID</th>
                      <th className="logs-th">Doctor ID</th>
                      <th className="logs-th">Doctor Name</th>
                      <th className="logs-th">Access Type</th>
                      <th className="logs-th">Role</th>
                    </tr>
                  </thead>
                  <tbody className="logs-table-body">
                    {logs.map((log, idx) => (
                      <tr key={idx} className="logs-table-row">
                        <td className="logs-td logs-time">{formatTime(log.timestamp)}</td>
                        <td className="logs-td"><code className="logs-code">{log.patient_id}</code></td>
                        <td className="logs-td"><code className="logs-code">{log.doctor_id || log.actor_id || "-"}</code></td>
                        <td className="logs-td">{log.doctor_name || "-"}</td>
                        <td className="logs-td">
                          <span className={`logs-badge logs-${log.mode?.toLowerCase() || 'unknown'}`}>
                            {accessLabel(log.mode)}
                          </span>
                        </td>
                        <td className="logs-td">{log.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
