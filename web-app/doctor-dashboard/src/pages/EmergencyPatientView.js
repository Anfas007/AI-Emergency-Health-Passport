import { useState } from "react";
import { fetchEmergencyPatientView } from "../services/api";
import MedicalPassport from "../components/MedicalPassport";
import PatientTimeline from "./PatientTimeline";

export default function EmergencyPatientView({ onBack }) {
  const [patientId, setPatientId] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    if (!patientId.trim()) return;
    setLoading(true);
    setError("");
    setData(null);
    try {
      const result = await fetchEmergencyPatientView(patientId.trim());
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to load patient");
    } finally {
      setLoading(false);
    }
  };

  const severityClass = (sev) => {
    if (sev === "CRITICAL") return "severity-critical";
    if (sev === "HIGH") return "severity-high";
    return "severity-moderate";
  };

  return (
    <div className="animate-fade-in">
      <h2 className="page-title">Emergency Patient View</h2>
      <p className="page-subtitle">Access critical patient data in emergencies</p>

      {/* Search */}
      <div className="step-card">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            className="form-input"
            placeholder="Enter Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={handleFetch} disabled={loading} className="btn btn-danger">
            {loading ? "Loading..." : "Load Patient"}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <>
          <MedicalPassport data={data} />

          {data.recent_sessions && data.recent_sessions.length > 0 && (
            <div className="step-card">
              <h3 className="step-heading"><span className="step-number">⚡</span> Recent Emergency Sessions</h3>
              {data.recent_sessions.map((s, idx) => (
                <div key={idx} className={`alert ${s.severity === "CRITICAL" ? "alert-error" : "alert-warning"}`} style={{ marginBottom: 10 }}>
                  <div className="flex-between" style={{ marginBottom: 6 }}>
                    <strong>{s.session_id}</strong>
                    <span className={`badge ${severityClass(s.severity)}`}>{s.severity}</span>
                  </div>
                  <p style={{ margin: "4px 0", fontSize: 13 }}><strong>Condition:</strong> {s.possible_condition}</p>
                  <p style={{ margin: "4px 0", fontSize: 13 }}><strong>Time:</strong> {s.timestamp}</p>
                  {s.input_vitals && (
                    <p style={{ margin: "4px 0", fontSize: 12, color: "var(--text-secondary)" }}>
                      HR: {s.input_vitals.heart_rate} | SpO2: {s.input_vitals.spo2} |
                      BP: {s.input_vitals.systolic_bp}/{s.input_vitals.diastolic_bp}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <PatientTimeline patientId={patientId.trim()} />
        </>
      )}
    </div>
  );
}
