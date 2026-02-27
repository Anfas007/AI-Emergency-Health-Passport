import { useState } from "react";
import { selectHospital } from "../services/api";

/**
 * HospitalSelector — shown when a doctor has multiple hospital affiliations.
 * The doctor must select which hospital to operate under for this session.
 * A new JWT is issued that includes the selected hospital_code.
 */
export default function HospitalSelector({ hospitals, onSelect, doctorName }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSelect = async (hospital) => {
    setLoading(true);
    setError("");
    try {
      const result = await selectHospital(hospital.hospital_code);
      onSelect(hospital.hospital_code, hospital.hospital_name, result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="selector-overlay">
      <div className="selector-card">
        <div style={{ fontSize: 48, marginBottom: 8 }}>🏥</div>
        <h2 className="text-primary" style={{ margin: "0 0 8px", fontSize: 22 }}>Select Hospital</h2>
        <p className="text-secondary" style={{ fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
          Welcome, <strong>{doctorName}</strong>. You are affiliated with
          multiple hospitals. Please select which hospital you want to operate
          under for this session.
        </p>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="selector-list">
          {hospitals.map((h) => (
            <button
              key={h.hospital_code}
              className="selector-btn"
              onClick={() => handleSelect(h)}
              disabled={loading}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <strong className="text-primary" style={{ fontSize: 16 }}>
                  {h.hospital_name || h.hospital_code}
                </strong>
                <span className="text-muted" style={{ fontSize: 12 }}>
                  Code: {h.hospital_code} &nbsp;|&nbsp; Role: {h.role || "doctor"}
                  {h.department ? ` | Dept: ${h.department}` : ""}
                </span>
              </div>
              <span className="text-primary fw-700" style={{ fontSize: 20 }}>→</span>
            </button>
          ))}
        </div>

        {loading && (
          <div className="loading-bar" style={{ marginTop: 16 }}>
            <div className="spinner" /><span>Setting active hospital…</span>
          </div>
        )}
      </div>
    </div>
  );
}
