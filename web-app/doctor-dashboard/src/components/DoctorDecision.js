import { useState } from "react";

export default function DoctorDecision({ onConfirm }) {
  const [decision, setDecision] = useState("");
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!decision) return;
    const payload = { decision, reason };
    if (typeof onConfirm === "function") onConfirm(payload);
  };

  return (
    <div className="step-card">
      <h3 className="step-heading"><span className="step-number">⚖️</span> Doctor Final Decision</h3>

      <div className="form-group">
        <select value={decision} onChange={(e) => setDecision(e.target.value)} className="form-select">
          <option value="">Select decision</option>
          <option value="accept">✅ Accept AI Recommendation</option>
          <option value="override">⚠️ Override AI Recommendation</option>
        </select>
      </div>

      {decision === "override" && (
        <div className="form-group">
          <label className="form-label">Reason for Override</label>
          <textarea className="form-textarea" placeholder="Reason for overriding AI" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
      )}

      <button className="btn btn-primary" onClick={handleConfirm} disabled={!decision} style={{ marginTop: 8 }}>
        Confirm Decision
      </button>

      <p className="form-hint" style={{ marginTop: 10 }}>
        ⚠️ AI suggestions are advisory only. Final medical decision is taken by the doctor.
      </p>
    </div>
  );
}
