import { useState, useEffect } from "react";
import { fetchRecordAccess } from "../services/api";

export default function RecordAccessMonitor({ onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRecordAccess()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <h2 className="page-title">Record Access Monitor</h2>
      <p className="page-subtitle">Track who accessed patient records and emergency data</p>

      {loading && <p className="text-muted loading-pulse" style={{ padding: 20 }}>Loading access data...</p>}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {data && (
        <>
          {/* KPI Stats */}
          <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            <div className="kpi-card">
              <div className="kpi-icon green">🔍</div>
              <div>
                <div className="kpi-value">{data.total_access_events}</div>
                <div className="kpi-label">Total Access Events</div>
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-icon red">⚡</div>
              <div>
                <div className="kpi-value" style={{ color: "var(--danger)" }}>{data.total_auto_shares}</div>
                <div className="kpi-label">Auto-Shared (CRITICAL)</div>
              </div>
            </div>
          </div>

          {/* Emergency Access Logs */}
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Emergency Access Logs</h3>
          {data.emergency_access_logs.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No access logs yet.</div>
          ) : (
            <div className="table-container" style={{ marginBottom: 28 }}>
              <table>
                <thead><tr><th>Timestamp</th><th>Patient ID</th><th>Role</th><th>Mode</th><th>Detail</th></tr></thead>
                <tbody>
                  {data.emergency_access_logs.map((l, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{l.timestamp}</td>
                      <td style={{ fontWeight: 600 }}>{l.patient_id || "—"}</td>
                      <td><span className={`badge ${l.role === "hospital" ? "badge-success" : "badge-info"}`}>{l.role}</span></td>
                      <td>{l.mode || "EMERGENCY"}</td>
                      <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{l.detail || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Auto-Shared Records */}
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Auto-Shared Records</h3>
          {data.auto_shared_records.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 32, color: "var(--text-muted)" }}>No auto-shares yet.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Session</th><th>Patient</th><th>Severity</th><th>Condition</th><th>Status</th><th>Expires</th></tr></thead>
                <tbody>
                  {data.auto_shared_records.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>{r.session_id}</td>
                      <td style={{ fontWeight: 600 }}>{r.patient_id}</td>
                      <td><span className="badge badge-danger">{r.severity}</span></td>
                      <td>{r.possible_condition || "—"}</td>
                      <td><span className={`badge ${r.status === "active" ? "badge-success" : "badge-neutral"}`}>{r.status}</span></td>
                      <td style={{ fontSize: 12 }}>{r.expires_at ? new Date(r.expires_at).toLocaleString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
