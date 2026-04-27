/**
 * Step 7 — FHIR Record Update summary
 * Shows what was saved as FHIR-structured resources:
 * Observation, Condition, MedicationRequest.
 * Timestamped entry with doctor signature.
 */
import { formatLocalDateTime } from "../utils/time";

export default function FHIRRecordUpdate({ consultation }) {
  if (!consultation) return null;

  return (
    <div className="fhir-card">
      <h3 className="step-heading" style={{ color: "var(--success)" }}><span className="step-number" style={{ background: "var(--success)" }}>7</span> FHIR-Based Record Saved</h3>

      <div className="fhir-grid">
        <ResourceBlock title="📌 Observation" items={[
          { label: "Chief Complaint", value: consultation.chief_complaint },
          { label: "Symptoms", value: (consultation.symptoms || []).join(", ") || "—" },
          { label: "Vitals", value: formatVitals(consultation) },
          { label: "Clinical Obs.", value: consultation.clinical_observations || "—" },
        ]} />

        <ResourceBlock title="🩺 Condition" items={[
          { label: "Provisional", value: consultation.provisional_diagnosis || "—" },
          { label: "Final", value: consultation.final_diagnosis || "—" },
        ]} />

        <ResourceBlock title="💊 MedicationRequest" items={[
          { label: "Treatment", value: consultation.treatment_plan || "—" },
          { label: "Medications", value: (consultation.medications_prescribed || []).join(", ") || "—" },
          { label: "Follow-up", value: consultation.follow_up_advice || "—" },
          { label: "Next Visit", value: consultation.follow_up_date || "—" },
        ]} />
      </div>

      <div className="text-secondary" style={{ marginTop: 14, fontSize: 12 }}>
        <span>🕐 {consultation.timestamp ? formatLocalDateTime(consultation.timestamp) : "—"}</span>
        <span style={{ marginLeft: 16 }}>✍️ {consultation.doctor_signature || "—"}</span>
      </div>
    </div>
  );
}

function formatVitals(c) {
  const parts = [];
  if (c.heart_rate) parts.push(`HR ${c.heart_rate} bpm`);
  if (c.blood_pressure) parts.push(`BP ${c.blood_pressure}`);
  if (c.temperature) parts.push(`Temp ${c.temperature}°C`);
  if (c.spo2) parts.push(`SpO₂ ${c.spo2}%`);
  if (c.respiratory_rate) parts.push(`RR ${c.respiratory_rate}/min`);
  if (c.weight) parts.push(`Wt ${c.weight} kg`);
  return parts.length ? parts.join("  •  ") : "—";
}

function ResourceBlock({ title, items }) {
  return (
    <div className="fhir-block">
      <div className="fhir-block-title">{title}</div>
      {items.map((it, i) => (
        <div key={i} style={{ fontSize: 13, marginBottom: 3 }}>
          <span className="text-muted">{it.label}: </span>
          <span className="fw-600">{it.value}</span>
        </div>
      ))}
    </div>
  );
}
