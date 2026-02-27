import { useState } from "react";
import { notifyPatient } from "../services/api";

/**
 * Step 8 — Patient Notification
 * Notifies patient of new record. Patient can view, download, revoke access.
 * Patient remains data owner.
 */
export default function PatientNotification({ patientId, consultationId }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleNotify = async () => {
    setSending(true);
    setError("");
    try {
      const res = await notifyPatient(patientId, {
        consultation_id: consultationId,
        message: `A new consultation record (${consultationId}) has been added to your health passport.`,
      });
      setResult(res.notification || res);
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  if (!consultationId) return null;

  return (
    <div className="step-card">
      <h3 className="step-heading"><span className="step-number">8</span> Patient Notification</h3>

      {!sent ? (
        <>
          <p className="text-secondary" style={{ fontSize: 13, margin: "0 0 12px" }}>
            Notify the patient that a new consultation record has been created.
            The patient will be able to <strong>view</strong>, <strong>download</strong>,
            and <strong>revoke future access</strong> to this record.
          </p>
          <button onClick={handleNotify} disabled={sending} className="btn btn-notify">
            {sending ? "Sending…" : "📤 Send Notification to Patient"}
          </button>
          {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}
        </>
      ) : (
        <div className="card-success" style={{ padding: 14, borderRadius: "var(--radius-sm)" }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, color: "var(--success)" }}>
            ✅ Patient notified successfully
          </p>
          <div className="text-secondary" style={{ fontSize: 13 }}>
            <div>Notification ID: <strong>{result?.notification_id || "—"}</strong></div>
            <div>Status: <strong>{result?.status || "sent"}</strong></div>
            <div className="text-muted" style={{ marginTop: 6, fontSize: 12 }}>
              Patient actions available: View • Download • Revoke Access
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


