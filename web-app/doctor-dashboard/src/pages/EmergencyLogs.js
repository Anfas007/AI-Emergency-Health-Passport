import { useState, useEffect } from "react";
import { fetchEmergencyLogs } from "../services/api";

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
    <div className="animate-fade-in">
      <div className="flex-between mb-4">
        <div>
          <h2 className="page-title">Emergency Access Logs</h2>
          <p className="page-subtitle">Showing your personal emergency access events only.</p>
        </div>
        <button onClick={loadLogs} disabled={loading} className="btn btn-outline">
          {loading ? "Loading..." : "↻ Refresh"}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!loading && logs.length === 0 && (
        <div className="step-card" style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>📋</p>
          <p>No emergency access logs recorded yet.</p>
        </div>
      )}

      {logs.length > 0 && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Patient ID</th>
                <th>Role</th>
                <th>Mode</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx}>
                  <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{log.timestamp}</td>
                  <td><code>{log.patient_id}</code></td>
                  <td>{log.role}</td>
                  <td><span className="badge badge-emergency">{log.mode}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
