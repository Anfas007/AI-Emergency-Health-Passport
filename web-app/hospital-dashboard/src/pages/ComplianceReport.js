import { useState } from "react";
import { generateComplianceReport } from "../services/api";

export default function ComplianceReport({ onBack }) {
  const [form, setForm] = useState({ start_date: "", end_date: "" });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) { setError("Both dates are required."); return; }
    setError(""); setLoading(true); setReport(null);
    try {
      const data = await generateComplianceReport(form);
      setReport(data);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 800 }}>
      <h2 className="page-title">Compliance Report</h2>
      <p className="page-subtitle">Generate compliance reports for a specific date range</p>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input type="date" className="form-input" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 16 }}>
            {loading ? "Generating..." : "📊 Generate Report"}
          </button>
        </form>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {report && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--primary)", marginTop: 0, marginBottom: 20 }}>Report Summary</h3>

          <div className="kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", marginBottom: 24 }}>
            <StatCard label="Period" value={`${report.period?.start || form.start_date} — ${report.period?.end || form.end_date}`} small />
            <StatCard label="Total Events" value={report.total_events} />
            <StatCard label="CRITICAL Cases" value={report.critical_cases} variant="danger" />
            <StatCard label="Auto-Shares" value={report.auto_shares} variant="warning" />
            <StatCard label="Active Shares" value={report.active_shares} variant="success" />
            <StatCard label="Expired Shares" value={report.expired_shares} />
          </div>

          {report.top_patients && report.top_patients.length > 0 && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10 }}>Top Accessed Patients</h4>
              <div className="table-container">
                <table>
                  <thead><tr><th>Patient ID</th><th>Access Count</th></tr></thead>
                  <tbody>
                    {report.top_patients.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600, fontFamily: "monospace" }}>{p.patient_id}</td>
                        <td><span className="badge badge-primary">{p.count}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          <div style={{ textAlign: "right", marginTop: 16 }}>
            <button onClick={() => window.print()} className="btn btn-outline" style={{ fontSize: 13 }}>
              🖨️ Print Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, variant, small }) {
  const colorMap = { danger: "var(--danger)", warning: "var(--warning)", success: "var(--success)" };
  const color = colorMap[variant] || "var(--text-primary)";
  return (
    <div className="kpi-card" style={{ padding: "16px 20px" }}>
      <div style={{ fontSize: small ? 13 : 22, fontWeight: 700, color }}>{value ?? "—"}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{label}</div>
    </div>
  );
}
