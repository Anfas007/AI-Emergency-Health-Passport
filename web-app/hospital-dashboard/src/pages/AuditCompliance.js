import { useState, useEffect, useRef } from "react";
import { fetchEnhancedAuditLogs } from "../services/api";

export default function AuditCompliance({ onBack }) {
  const [logs, setLogs] = useState([]);
  const [accessTypes, setAccessTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);

  // Filters
  const [filters, setFilters] = useState({
    patient_id: "",
    doctor_id: "",
    access_type: "",
    date_from: "",
    date_to: "",
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  const tableRef = useRef(null);

  const loadLogs = async (f = {}) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchEnhancedAuditLogs(f);
      setLogs(data.logs || []);
      setAccessTypes(data.access_types || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    setAppliedFilters({ ...filters });
    loadLogs(filters);
  };

  const clearFilters = () => {
    const empty = { patient_id: "", doctor_id: "", access_type: "", date_from: "", date_to: "" };
    setFilters(empty);
    setAppliedFilters({});
    loadLogs(empty);
  };

  const updateFilter = (key, val) => {
    setFilters((f) => ({ ...f, [key]: val }));
  };

  // ── Export CSV ──
  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Timestamp", "Action/Mode", "Patient ID", "Actor/Doctor", "Role", "Hospital Code", "Detail"];
    const rows = logs.map((l) => [
      l.timestamp || "",
      l.mode || "",
      l.patient_id || "",
      l.actor_id || "",
      l.role || "",
      l.hospital_code || "",
      `"${(l.detail || "").replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadFile(csv, "audit_logs.csv", "text/csv");
  };

  // ── Export PDF (simple HTML-based) ──
  const exportPDF = () => {
    if (logs.length === 0) return;
    const htmlContent = `
      <html><head><title>Audit Logs — AEHP</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
        h1 { font-size: 18px; color: #0E7490; margin-bottom: 4px; }
        h2 { font-size: 13px; color: #64748B; font-weight: normal; margin-bottom: 16px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #E2E8F0; padding: 6px 10px; text-align: left; font-size: 11px; }
        th { background: #0891B2; color: white; }
        tr:nth-child(even) { background: #F8FAFC; }
        .meta { color: #94A3B8; font-size: 10px; margin-top: 16px; }
      </style></head><body>
      <h1>🏥 AI Emergency Health Passport — Audit Logs</h1>
      <h2>Generated: ${new Date().toLocaleString()} | Total Records: ${logs.length}</h2>
      ${Object.values(appliedFilters).some(v => v) ? `<p style="font-size:11px;color:#64748B;">Filters: ${JSON.stringify(appliedFilters)}</p>` : ""}
      <table>
        <thead><tr><th>Timestamp</th><th>Mode</th><th>Patient</th><th>Actor</th><th>Role</th><th>Detail</th></tr></thead>
        <tbody>${logs.map(l => `
          <tr>
            <td>${l.timestamp ? new Date(l.timestamp).toLocaleString() : "—"}</td>
            <td>${l.mode || "—"}</td>
            <td>${l.patient_id || "—"}</td>
            <td>${l.actor_id || "—"}</td>
            <td>${l.role || "—"}</td>
            <td>${l.detail || "—"}</td>
          </tr>`).join("")}
        </tbody>
      </table>
      <p class="meta">This is an immutable audit log export for legal & regulatory compliance. © 2026 AEHP Platform</p>
      </body></html>`;
    const win = window.open("", "_blank");
    win.document.write(htmlContent);
    win.document.close();
    win.print();
  };

  const downloadFile = (content, filename, mime) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Mode badge
  const modeBadge = (mode) => {
    if (!mode) return "badge-neutral";
    const m = mode.toUpperCase();
    if (m === "EMERGENCY" || m === "QR_SCAN") return "badge-danger";
    if (m === "NORMAL_CONSULTATION") return "badge-info";
    if (m === "NOTIFICATION") return "badge-success";
    return "badge-neutral";
  };

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  return (
    <div className="animate-fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 className="page-title">Audit Logs & Compliance</h2>
          <p className="page-subtitle">Immutable access logs for legal & regulatory compliance</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={exportCSV} className="btn btn-secondary btn-sm" disabled={logs.length === 0}>
            📄 Export CSV
          </button>
          <button onClick={exportPDF} className="btn btn-secondary btn-sm" disabled={logs.length === 0}>
            📑 Export PDF
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* Filter Panel */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
            🔍 Filters {activeFilterCount > 0 && <span className="badge badge-primary" style={{ marginLeft: 8, fontSize: 11 }}>{activeFilterCount} active</span>}
          </h3>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn btn-secondary btn-sm" style={{ fontSize: 12 }}>
              Clear All
            </button>
          )}
        </div>
        <form onSubmit={handleFilter} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, alignItems: "flex-end" }}>
          <div>
            <label style={labelStyle}>Patient ID</label>
            <input
              className="search-input"
              placeholder="AEHP-XXXX"
              value={filters.patient_id}
              onChange={(e) => updateFilter("patient_id", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={labelStyle}>Doctor / Actor ID</label>
            <input
              className="search-input"
              placeholder="DOC-XXXX"
              value={filters.doctor_id}
              onChange={(e) => updateFilter("doctor_id", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <div>
            <label style={labelStyle}>Access Type</label>
            <select
              className="search-input"
              value={filters.access_type}
              onChange={(e) => updateFilter("access_type", e.target.value)}
              style={{ width: "100%", height: 42 }}
            >
              <option value="">All Types</option>
              {accessTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Date From</label>
            <input
              type="date"
              className="search-input"
              value={filters.date_from}
              onChange={(e) => updateFilter("date_from", e.target.value)}
              style={{ width: "100%", height: 42 }}
            />
          </div>
          <div>
            <label style={labelStyle}>Date To</label>
            <input
              type="date"
              className="search-input"
              value={filters.date_to}
              onChange={(e) => updateFilter("date_to", e.target.value)}
              style={{ width: "100%", height: 42 }}
            />
          </div>
          <div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", height: 42 }}>
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Stats Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard icon="📊" label="Total Records" value={total} color="var(--primary)" />
        <StatCard icon="🚨" label="Emergency" value={logs.filter(l => (l.mode || "").toUpperCase() === "EMERGENCY").length} color="var(--danger)" />
        <StatCard icon="🔍" label="QR Scans" value={logs.filter(l => (l.mode || "").toUpperCase() === "QR_SCAN").length} color="var(--warning)" />
        <StatCard icon="🩺" label="Consultations" value={logs.filter(l => (l.mode || "").toUpperCase() === "NORMAL_CONSULTATION").length} color="var(--info)" />
      </div>

      {/* Logs Table */}
      {loading ? (
        <p className="text-muted loading-pulse" style={{ padding: 20 }}>Loading audit logs...</p>
      ) : logs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
          <p>No audit logs found matching the current filters.</p>
        </div>
      ) : (
        <div className="table-container" ref={tableRef}>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Access Type</th>
                <th>Patient ID</th>
                <th>Actor / Doctor</th>
                <th>Role</th>
                <th>Hospital</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                    {l.timestamp ? new Date(l.timestamp).toLocaleString() : "—"}
                  </td>
                  <td>
                    <span className={`badge ${modeBadge(l.mode)}`}>
                      {l.mode || "—"}
                    </span>
                  </td>
                  <td><span style={{ fontFamily: "monospace", fontSize: 12 }}>{l.patient_id || "—"}</span></td>
                  <td style={{ fontSize: 12 }}>{l.actor_id || "—"}</td>
                  <td><span className={`badge ${l.role === "doctor" ? "badge-info" : l.role === "hospital" ? "badge-success" : "badge-neutral"}`}>{l.role || "—"}</span></td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{l.hospital_code || "—"}</td>
                  <td style={{ fontSize: 12, color: "var(--text-secondary)", maxWidth: 240, wordBreak: "break-word" }}>
                    {l.detail || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
          Showing {logs.length} of {total} entries
          {activeFilterCount > 0 && ` (${activeFilterCount} filter${activeFilterCount > 1 ? "s" : ""} applied)`}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
          🔒 Immutable audit trail — records cannot be modified or deleted
        </div>
      </div>
    </div>
  );
}

/* ── Helper Components ── */

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card" style={{
      flex: "1 1 140px", padding: "16px 20px", display: "flex", alignItems: "center", gap: 12,
      minWidth: 140,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: "var(--radius)",
        background: `${color}15`, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 20, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>{label}</div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--text-secondary)", marginBottom: 4,
};
