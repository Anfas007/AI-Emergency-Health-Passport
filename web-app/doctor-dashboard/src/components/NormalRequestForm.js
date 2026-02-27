import { useState } from "react";
import { requestNormalAccess } from "../services/api";

export default function NormalRequestForm({ onPatientLoaded }) {
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRequest = async () => {
    if (!patientId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await requestNormalAccess(patientId.trim());
      if (typeof onPatientLoaded === "function") onPatientLoaded(data);
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="step-card">
      <h4 className="step-heading">Request Patient Access</h4>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="form-input"
          style={{ flex: 1 }}
        />
        <button onClick={handleRequest} disabled={loading} className="btn btn-primary">
          {loading ? "Requesting…" : "Request Access"}
        </button>
      </div>
      {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
