import { useState } from "react";
import { fetchPatientHistory } from "../services/api";

export default function MedicalHistoryViewer({ patientId: propPatientId }) {
  const [patientId, setPatientId] = useState(propPatientId || "");
  const [history, setHistory] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFetch = async () => {
    if (!patientId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchPatientHistory(patientId.trim());
      setHistory(data);
    } catch (err) {
      setError(err.message || "Could not fetch history");
      setHistory(null);
    } finally {
      setLoading(false);
    }
  };

  const renderList = (label, items) => {
    const list = Array.isArray(items) ? items : (items ? [items] : []);
    return (
      <div style={{ marginBottom: 10 }}>
        <span className="passport-field-label">{label}</span>
        {list.length > 0 ? (
          <ul style={{ margin: "4px 0", paddingLeft: 20 }}>
            {list.map((item, i) => <li key={i}>{typeof item === "string" ? item : JSON.stringify(item)}</li>)}
          </ul>
        ) : (
          <span className="text-muted" style={{ marginLeft: 8 }}>None recorded</span>
        )}
      </div>
    );
  };

  return (
    <div className="step-card">
      {!propPatientId && (
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input
            placeholder="Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="form-input"
            style={{ flex: 1 }}
          />
          <button onClick={handleFetch} disabled={loading} className="btn btn-primary">
            {loading ? "Loading…" : "Fetch History"}
          </button>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}

      {history && (
        <div className="passport-card">
          <div className="passport-grid">
            <p><span className="passport-field-label">Name</span> <span className="passport-field-value">{history.name || "N/A"}</span></p>
            <p><span className="passport-field-label">Blood Group</span> <span className="passport-field-value text-danger fw-700">{history.blood_group || "N/A"}</span></p>
          </div>
          <div className="divider" />
          {renderList("Past Diagnoses", history.past_diagnoses)}
          {renderList("Medications", history.medications)}
          {renderList("Allergies", history.allergies)}
          {renderList("Chronic Conditions", history.chronic_conditions)}
          {renderList("Previous Emergencies", history.previous_emergencies)}
        </div>
      )}
    </div>
  );
}
