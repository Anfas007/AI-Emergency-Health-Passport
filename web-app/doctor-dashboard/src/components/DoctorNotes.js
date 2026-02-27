import { useState } from "react";

export default function DoctorNotes({ onSave }) {
  const [notes, setNotes] = useState("");

  const handleSave = () => {
    if (typeof onSave === "function") onSave({ notes });
  };

  return (
    <div className="step-card">
      <h3 className="step-heading"><span className="step-number">📝</span> Doctor Notes</h3>
      <div className="form-group">
        <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Enter observations, diagnosis, plan..." style={{ minHeight: 100 }} />
      </div>
      <button className="btn btn-primary" onClick={handleSave}>💾 Save Notes</button>
    </div>
  );
}
