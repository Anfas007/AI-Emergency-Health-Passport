import { useState } from "react";

const RECORD_FIELDS = [
  { key: "past_diagnoses", label: "Past Diagnoses", placeholder: "e.g. Type 2 Diabetes, Hypertension" },
  { key: "medications", label: "Current Medications", placeholder: "e.g. Metformin 500mg, Lisinopril 10mg" },
  { key: "allergies", label: "Allergies", placeholder: "e.g. Penicillin, Sulfa drugs" },
  { key: "chronic_conditions", label: "Chronic Conditions", placeholder: "e.g. Asthma, CKD Stage 3" },
  { key: "previous_emergencies", label: "Previous Emergencies", placeholder: "e.g. MI in 2023, Anaphylaxis in 2021" },
];

export default function MedicalRecordForm({ existingData, onSave, saving }) {
  // Initialize each field from existing data (array → comma-separated string for editing)
  const toStr = (val) => (Array.isArray(val) ? val.join(", ") : val || "");

  const [fields, setFields] = useState(() =>
    RECORD_FIELDS.reduce((acc, f) => {
      acc[f.key] = toStr(existingData?.[f.key]);
      return acc;
    }, {})
  );
  const [bloodGroup, setBloodGroup] = useState(existingData?.blood_group || "");

  const handleChange = (key, value) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    // Convert comma-separated strings into arrays; skip empty fields
    const payload = {};
    for (const f of RECORD_FIELDS) {
      const raw = fields[f.key].trim();
      if (raw) {
        payload[f.key] = raw.split(",").map((s) => s.trim()).filter(Boolean);
      }
    }
    if (bloodGroup.trim()) {
      payload.blood_group = bloodGroup.trim();
    }
    if (Object.keys(payload).length === 0) return;
    onSave(payload);
  };

  return (
    <div className="step-card">
      <h4 className="step-heading">Add / Update Medical Records</h4>

      <div className="form-group">
        <label className="form-label">Blood Group</label>
        <input
          value={bloodGroup}
          onChange={(e) => setBloodGroup(e.target.value)}
          placeholder="e.g. O+, A-, B+"
          className="form-input"
          style={{ maxWidth: 200 }}
        />
      </div>

      {RECORD_FIELDS.map((f) => (
        <div key={f.key} className="form-group">
          <label className="form-label">{f.label}</label>
          <textarea
            value={fields[f.key]}
            onChange={(e) => handleChange(f.key, e.target.value)}
            placeholder={f.placeholder}
            rows={2}
            className="form-textarea"
          />
          <small className="form-hint">Separate multiple entries with commas</small>
        </div>
      ))}

      <button onClick={handleSubmit} disabled={saving} className="btn btn-success btn-lg w-full">
        {saving ? "Saving…" : "💾 Save Medical Records"}
      </button>
    </div>
  );
}
