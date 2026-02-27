import { useState } from "react";
import { requestNormalAccess } from "../services/api";

/**
 * Step 1 — Patient Identification
 * Load patient by Patient ID or QR code.
 * Validates patient existence — no emergency auto-access.
 */
export default function PatientIdentification({ onPatientLoaded }) {
  const [mode, setMode] = useState("id"); // "id" | "qr"
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLoad = async (id) => {
    const pid = (id || patientId).trim();
    if (!pid) return;
    setLoading(true);
    setError("");
    try {
      const data = await requestNormalAccess(pid);
      if (typeof onPatientLoaded === "function") onPatientLoaded(data);
    } catch (err) {
      setError(err.message || "Patient not found");
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = () => {
    // Simple prompt-based QR input (until a scanner library is wired)
    const scanned = window.prompt("Scan or enter Patient ID from QR code:");
    if (scanned && scanned.trim()) {
      setPatientId(scanned.trim());
      handleLoad(scanned.trim());
    }
  };

  return (
    <div className="step-card">
      <h3 className="step-heading"><span className="step-number">1</span> Patient Identification</h3>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={() => setMode("id")}
          className={`chip ${mode === "id" ? "chip-active" : "chip-default"}`}>
          🪪 Patient ID
        </button>
        <button type="button" onClick={() => { setMode("qr"); handleQRScan(); }}
          className={`chip ${mode === "qr" ? "chip-active" : "chip-default"}`}>
          📷 QR Code
        </button>
      </div>

      {/* Patient ID input */}
      {mode === "id" && (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Enter Patient ID (e.g. HP-1234-5678)"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            className="form-input"
            style={{ flex: 1 }}
          />
          <button onClick={() => handleLoad()} disabled={loading} className="btn btn-primary">
            {loading ? "Loading…" : "Load Patient"}
          </button>
        </div>
      )}

      <p className="form-hint" style={{ marginTop: 8 }}>
        ⚠️ No emergency auto-access. Patient must be validated before proceeding.
      </p>

      {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
