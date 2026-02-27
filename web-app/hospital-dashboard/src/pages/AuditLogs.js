import { useState, useEffect } from "react";
import { fetchAuditLogs } from "../services/api";

export default function AuditLogs({ onBack }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchAuditLogs()
      .then(data => setLogs(data.logs || data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter
    ? logs.filter(l =>
        (l.action || "").toLowerCase().includes(filter.toLowerCase()) ||
        (l.patient_id || "").toLowerCase().includes(filter.toLowerCase()) ||
        (l.role || "").toLowerCase().includes(filter.toLowerCase()) ||
        (l.detail || "").toLowerCase().includes(filter.toLowerCase())
      )
    : logs;

  const roleBadge = (role) => {
    if (role === "hospital") return "badge-success";
    if (role === "doctor") return "badge-info";
    return "badge-neutral";
  };

  return (
    <div className="animate-fade-in">
      <h2 className="page-title">Emergency Access Logs</h2>
      <p className="page-subtitle">Timeline-style audit trail of all emergency access events</p>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="search-input-wrapper">
        <input
          placeholder="Filter by action, patient, role, detail..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="search-input"
        />
      </div>

      {loading ? (
        <p className="text-muted loading-pulse" style={{ padding: 20 }}>Loading audit logs...</p>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p>No audit logs found.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Patient ID</th>
                <th>Role</th>
                <th>Mode</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {l.timestamp ? new Date(l.timestamp).toLocaleString() : "—"}
                  </td>
                  <td style={{ fontWeight: 600 }}>{l.action || "—"}</td>
                  <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{l.patient_id || "—"}</span></td>
                  <td><span className={`badge ${roleBadge(l.role)}`}>{l.role || "—"}</span></td>
                  <td>{l.mode || "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 220, wordBreak: "break-word" }}>
                    {l.detail || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 16, color: "var(--text-muted)", fontSize: 12, textAlign: "right" }}>
        Showing {filtered.length} of {logs.length} entries
      </div>
    </div>
  );
}

