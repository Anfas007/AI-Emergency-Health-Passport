import { useState, useEffect } from "react";
import { fetchConsultationHistory } from "../services/api";

/**
 * Step 4 — Medical History Viewer (Timeline)
 * Visit-wise medical timeline with diagnoses, prescriptions,
 * lab data, and FHIR-structured records.
 */
export default function ConsultationTimeline({ patientId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    setError("");
    fetchConsultationHistory(patientId)
      .then(res => setRecords(res.consultations || []))
      .catch(err => setError(err.message || "Failed to load history"))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (!patientId) return null;

  return (
    <div className="step-card">
      <h3 className="step-heading"><span className="step-number">4</span> Medical History Timeline</h3>

      {loading && <div className="loading-bar"><div className="spinner" /><span>Loading consultation history…</span></div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && records.length === 0 && !error && (
        <p className="text-muted" style={{ fontStyle: "italic", textAlign: "center", padding: 16 }}>No past consultation records found.</p>
      )}

      <div className="timeline">
        {records.map((r, idx) => {
          const isOpen = expanded === idx;
          const obs = r.observation || {};
          const cond = r.condition || {};
          const med = r.medication_request || {};
          const fu = r.follow_up || {};
          const vitals = obs.vitals || {};

          return (
            <div key={r.consultation_id || idx} className="timeline-entry">
              <div className="timeline-dot-col">
                <div className="timeline-dot" />
                {idx < records.length - 1 && <div className="timeline-line" />}
              </div>

              <div className="timeline-content">
                <div className="timeline-header" onClick={() => setExpanded(isOpen ? null : idx)}>
                  <div>
                    <span className="text-muted" style={{ fontSize: 11, marginRight: 8 }}>{formatDate(r.timestamp)}</span>
                    <span className="text-primary fw-600" style={{ fontSize: 11 }}>{r.consultation_id}</span>
                  </div>
                  <div style={{ fontSize: 13 }}>
                    <strong>{cond.final_diagnosis || cond.provisional_diagnosis || "No diagnosis"}</strong>
                  </div>
                  <span className="text-secondary" style={{ fontSize: 12, marginLeft: "auto" }}>Dr. {r.doctor_name || "—"}</span>
                  <span className="text-muted" style={{ fontSize: 12, marginLeft: 8 }}>{isOpen ? "▲" : "▼"}</span>
                </div>

                {isOpen && (
                  <div className="timeline-details">
                    <Section title="📋 Observation">
                      {obs.chief_complaint && <Row label="Chief Complaint" value={obs.chief_complaint} />}
                      {obs.reason_for_visit && <Row label="Reason" value={obs.reason_for_visit} />}
                      {(obs.symptoms || []).length > 0 && <Row label="Symptoms" value={obs.symptoms.join(", ")} />}
                      {obs.clinical_observations && <Row label="Clinical Obs." value={obs.clinical_observations} />}
                      {hasVitals(vitals) && <Row label="Vitals" value={formatVitals(vitals)} />}
                    </Section>

                    <Section title="🩺 Condition">
                      {cond.provisional_diagnosis && <Row label="Provisional" value={cond.provisional_diagnosis} />}
                      {cond.final_diagnosis && <Row label="Final" value={cond.final_diagnosis} />}
                    </Section>

                    <Section title="💊 Medication">
                      {med.treatment_plan && <Row label="Treatment" value={med.treatment_plan} />}
                      {(med.medications_prescribed || []).length > 0 && (
                        <Row label="Medications" value={med.medications_prescribed.join(", ")} />
                      )}
                    </Section>

                    {(fu.advice || fu.date) && (
                      <Section title="📅 Follow-up">
                        {fu.advice && <Row label="Advice" value={fu.advice} />}
                        {fu.date && <Row label="Date" value={fu.date} />}
                      </Section>
                    )}

                    <div className="text-muted" style={{ fontSize: 11, marginTop: 8 }}>
                      ✍️ {r.doctor_signature || "—"}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="text-primary fw-700" style={{ fontSize: 13, marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ fontSize: 13, marginBottom: 2 }}>
      <span className="text-muted">{label}: </span>
      <span>{value}</span>
    </div>
  );
}

function hasVitals(v) {
  return v && (v.heart_rate || v.blood_pressure || v.temperature || v.spo2 || v.respiratory_rate || v.weight);
}

function formatVitals(v) {
  const parts = [];
  if (v.heart_rate) parts.push(`HR ${v.heart_rate}`);
  if (v.blood_pressure) parts.push(`BP ${v.blood_pressure}`);
  if (v.temperature) parts.push(`${v.temperature}°C`);
  if (v.spo2) parts.push(`SpO₂ ${v.spo2}%`);
  if (v.respiratory_rate) parts.push(`RR ${v.respiratory_rate}`);
  if (v.weight) parts.push(`${v.weight} kg`);
  return parts.join("  •  ");
}

function formatDate(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return ts;
  }
}


