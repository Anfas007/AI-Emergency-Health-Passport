/**
 * Patient snapshot card — vital identity info visible
 * BEFORE any AI or clinical decision.
 */
export default function PatientSnapshot({ patient }) {
  if (!patient) return null;

  const d = patient.emergency_data || patient;

  return (
    <div className="passport-card">
      <h3 className="step-heading"><span className="step-number">2</span> Patient Snapshot</h3>

      <div className="passport-grid">
        <Field label="Patient ID" value={patient.patient_id || d.patient_id || "—"} />
        <Field label="Name" value={d.name || "—"} />
        <Field label="Age" value={d.age || "—"} />
        <Field label="Gender" value={d.gender || "—"} />
        <Field label="Blood Group" value={d.blood_group || "—"} accent="var(--emergency)" />
      </div>

      <hr className="divider" />

      <div>
        <ListField icon="⚠️" label="Known Allergies" items={d.allergies} color="var(--warning)" />
        <ListField icon="🩺" label="Chronic Diseases" items={d.chronic_conditions} />
        <ListField icon="💊" label="Current Medications" items={d.medications} />
      </div>

      <div className="badge badge-success" style={{ marginTop: 12, padding: "6px 14px" }}>
        <span style={{ fontSize: 11 }}>🔒 Access Type:</span>{" "}
        <strong style={{ color: patient.access_type === "full_record" ? "var(--success)" : "var(--primary)" }}>
          {patient.access_type === "full_record" ? "Full Record" : "Critical Only"}
        </strong>
        <span className="text-muted" style={{ marginLeft: 6, fontSize: 11 }}>(Emergency)</span>
      </div>
    </div>
  );
}

function Field({ label, value, accent }) {
  return (
    <div>
      <div className="passport-field-label">{label}</div>
      <div className="passport-field-value" style={accent ? { color: accent } : {}}>{value}</div>
    </div>
  );
}

function ListField({ icon, label, items, color }) {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  return (
    <div style={{ marginBottom: 6, fontSize: 14 }}>
      <strong>{icon} {label}:</strong>{" "}
      <span style={color ? { color } : {}}>
        {list.length ? list.join(", ") : "None recorded"}
      </span>
    </div>
  );
}
