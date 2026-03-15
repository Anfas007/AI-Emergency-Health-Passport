import { useState } from "react";
import { searchPatients, getPatientDetail } from "../services/api";

export default function PatientManagement({ onBack }) {
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Detail view state
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId && !searchName) return;
    setLoading(true);
    setError("");
    setSelectedPatient(null);
    setDetail(null);
    try {
      const data = await searchPatients({ patient_id: searchId, name: searchName });
      setResults(data.patients || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (patientId) => {
    setSelectedPatient(patientId);
    setDetailLoading(true);
    setError("");
    try {
      const data = await getPatientDetail(patientId);
      setDetail(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedPatient(null);
    setDetail(null);
  };

  return (
    <div className="animate-fade-in">
      <h2 className="page-title">Patient Registry</h2>
      <p className="page-subtitle">Search patients, view demographics, consent & visit history</p>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {/* Search Form */}
      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Patient ID</label>
            <input
              className="search-input"
              placeholder="e.g. AEHP-XXXX"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={labelStyle}>Patient Name</label>
            <input
              className="search-input"
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}
            style={{ height: 42, padding: "0 24px" }}>
            {loading ? "Searching..." : "🔍 Search"}
          </button>
        </form>
      </div>

      {/* Detail View */}
      {selectedPatient && (
        <div className="card" style={{ marginBottom: 24, border: "2px solid var(--primary-200)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--primary-dark)" }}>
              📋 Patient Details — {selectedPatient}
            </h3>
            <button onClick={closeDetail} className="btn btn-secondary btn-sm">✕ Close</button>
          </div>

          {detailLoading ? (
            <p className="text-muted loading-pulse">Loading patient details...</p>
          ) : detail ? (
            <>
              {/* Demographics */}
              <SectionHeader icon="👤" title="Demographics" />
              <div style={gridStyle}>
                <InfoRow label="Name" value={detail.patient?.name} />
                <InfoRow label="Patient ID" value={detail.patient?.patient_id} mono />
                <InfoRow label="Age" value={detail.patient?.age} />
                <InfoRow label="Gender" value={detail.patient?.gender} />
                <InfoRow label="Blood Group" value={detail.patient?.blood_group} highlight />
                <InfoRow label="Phone" value={detail.patient?.phone || detail.patient?.contact} />
              </div>

              {/* Consent Status */}
              <SectionHeader icon="🔒" title="Consent Status" />
              <div style={{ marginBottom: 20 }}>
                {detail.consent_granted ? (
                  <span className="badge badge-success" style={{ fontSize: 13, padding: "6px 14px" }}>
                    ✅ Consent Granted
                  </span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: 13, padding: "6px 14px" }}>
                    ⚠️ No Active Consent
                  </span>
                )}
                {detail.consent?.expires_at && (
                  <span style={{ marginLeft: 12, fontSize: 12, color: "var(--text-muted)" }}>
                    Expires: {new Date(detail.consent.expires_at).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Medical Summary (read-only) */}
              <SectionHeader icon="🩺" title={`Medical Summary ${detail.consent_granted ? "" : "(Requires Consent to Edit)"}`} />
              <div style={gridStyle}>
                <InfoRow label="Allergies" value={formatList(detail.patient?.allergies)} />
                <InfoRow label="Chronic Conditions" value={formatList(detail.patient?.chronic_conditions)} />
                <InfoRow label="Medications" value={formatList(detail.patient?.medications)} />
                <InfoRow label="Past Diagnoses" value={formatList(detail.patient?.past_diagnoses)} />
              </div>
              {!detail.consent_granted && (
                <p style={{ fontSize: 12, color: "var(--warning)", marginTop: 4, marginBottom: 16 }}>
                  ℹ️ Editing medical records requires active patient consent.
                </p>
              )}

              {/* Hospital Visit History */}
              <SectionHeader icon="🏥" title="Hospital Visit History" />
              {(detail.visit_history || []).length === 0 ? (
                <p className="text-muted" style={{ padding: "12px 0" }}>No visits at this hospital yet.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Consultation ID</th>
                        <th>Doctor</th>
                        <th>Diagnosis</th>
                        <th>Chief Complaint</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.visit_history.map((v, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                            {v.timestamp ? new Date(v.timestamp).toLocaleDateString() : "—"}
                          </td>
                          <td style={{ fontFamily: "monospace", fontSize: 12 }}>{v.consultation_id || "—"}</td>
                          <td>{v.doctor_name || "—"}</td>
                          <td>{v.condition?.final_diagnosis || v.condition?.provisional_diagnosis || "—"}</td>
                          <td style={{ fontSize: 13, maxWidth: 200, wordBreak: "break-word" }}>
                            {v.observation?.chief_complaint || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Search Results */}
      {!selectedPatient && results.length > 0 && (
        <>
          <div style={{ marginBottom: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              Search Results ({results.length})
            </h3>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Blood Group</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((p) => (
                  <tr key={p.patient_id}>
                    <td>
                      <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--primary)" }}>
                        {p.patient_id}
                      </span>
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "var(--radius-full)",
                          background: "linear-gradient(135deg, var(--green), var(--teal))",
                          color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, flexShrink: 0,
                        }}>{(p.name || "P")[0]}</div>
                        {p.name || "—"}
                      </div>
                    </td>
                    <td>{p.age || "—"}</td>
                    <td>{p.gender || "—"}</td>
                    <td><span className="badge badge-info">{p.blood_group || "—"}</span></td>
                    <td>
                      <button onClick={() => openDetail(p.patient_id)} className="btn btn-primary btn-sm">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!selectedPatient && !loading && results.length === 0 && (searchId || searchName) && (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p>No patients found. Try a different search.</p>
        </div>
      )}

      {!selectedPatient && !searchId && !searchName && (
        <div className="card" style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏥</div>
          <p style={{ fontSize: 15 }}>Search by Patient ID or Name to view records</p>
          <p style={{ fontSize: 12, marginTop: 8 }}>Access is logged for audit & compliance</p>
        </div>
      )}
    </div>
  );
}

/* ── Helper Components ── */

function SectionHeader({ icon, title }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      marginTop: 20, marginBottom: 12,
      paddingBottom: 8, borderBottom: "1px solid var(--border-light)"
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>{title}</h4>
    </div>
  );
}

function InfoRow({ label, value, mono, highlight }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-light)" }}>
      <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 13 }}>{label}</span>
      <span style={{
        color: highlight ? "var(--danger)" : "var(--text-primary)",
        fontSize: 13, fontWeight: highlight ? 700 : 500,
        fontFamily: mono ? "monospace" : "inherit",
      }}>{value || "—"}</span>
    </div>
  );
}

function formatList(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return "—";
  return arr.join(", ");
}

const labelStyle = {
  display: "block", fontSize: 12, fontWeight: 600,
  color: "var(--text-secondary)", marginBottom: 6,
};

const gridStyle = {
  display: "grid", gridTemplateColumns: "1fr 1fr",
  gap: "0 24px", marginBottom: 12,
};
