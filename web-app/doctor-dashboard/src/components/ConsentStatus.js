import { useState, useEffect } from "react";
import { fetchConsentStatus, requestConsent } from "../services/api";

export default function ConsentStatus({ patientId, onConsentChange }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [reqLoading, setReqLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    fetchConsentStatus(patientId)
      .then((res) => {
        const c = res.consent || res;
        setStatus(c);
        if (onConsentChange) onConsentChange(!!c?.granted);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [patientId, onConsentChange]);

  const handleRequest = async () => {
    if (!patientId) return;
    setReqLoading(true);
    setError("");
    try {
      const res = await requestConsent(patientId);
      const requestedFor = res?.request?.patient_id || patientId;
      setStatus({ requested: true, patient_id: requestedFor });
      alert(`Consent request submitted for Patient ID: ${requestedFor}`);
    } catch (e) {
      setError(e.message || "Request failed");
    } finally {
      setReqLoading(false);
    }
  };

  if (!patientId) return null;

  return (
    <div className="step-card">
      <div className="flex-between">
        <div>
          <div className="fw-700" style={{ marginBottom: 4 }}>🔐 Consent Status</div>
          {loading ? (
            <div className="text-secondary">Checking consent…</div>
          ) : error ? (
            <div className="text-danger">Error: {error}</div>
          ) : status && status.granted ? (
            <div className="text-success">✅ Granted • Expires: {status.expires_at || "—"}</div>
          ) : status && status.requested ? (
            <div className="text-primary">⏳ Request pending for {status.patient_id || patientId}</div>
          ) : (
            <div className="text-secondary">No consent granted</div>
          )}
        </div>
        <button onClick={handleRequest} disabled={reqLoading} className="btn btn-primary btn-sm">
          {reqLoading ? "Requesting…" : "Request Additional Access"}
        </button>
      </div>
    </div>
  );
}
