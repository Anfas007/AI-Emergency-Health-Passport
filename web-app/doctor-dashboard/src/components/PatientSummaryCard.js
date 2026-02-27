/**
 * Step 3 — Patient Summary (Quick View)
 * Basic demographics, blood group, known allergies,
 * chronic conditions, current medications.
 */
export default function PatientSummaryCard({ patient }) {
  if (!patient) return null;

  return (
    <div className="passport-card">
      <h3 className="step-heading"><span className="step-number">3</span> Patient Summary</h3>

      <div className="passport-grid">
        <Field label="Patient ID" value={patient.patient_id || "—"} />
        <Field label="Name" value={patient.name || "—"} />
        <Field label="Age" value={patient.age || "—"} />
        <Field label="Gender" value={patient.gender || "—"} />
        <Field label="Blood Group" value={patient.blood_group || "—"} accent="var(--emergency)" />
        <Field label="Access Type"
          value={patient.access_type === "normal" ? "Normal" : patient.access_type || "—"}
          accent="var(--primary)" />
      </div>

      <hr className="divider" />

      <div>
        <ListItem icon="⚠️" label="Known Allergies" items={patient.allergies} color="var(--warning)" />
        <ListItem icon="🩺" label="Chronic Conditions" items={patient.chronic_conditions} />
        <ListItem icon="💊" label="Current Medications" items={patient.medications} />
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

function ListItem({ icon, label, items, color }) {
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
