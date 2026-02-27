import { useState, useRef } from "react";

// Sub-components (Steps 1–9)
import PatientIdentification  from "../components/PatientIdentification";
import ConsentStatus           from "../components/ConsentStatus";
import PatientSummaryCard      from "../components/PatientSummaryCard";
import ConsultationTimeline    from "../components/ConsultationTimeline";
import SymptomVitalsEntry      from "../components/SymptomVitalsEntry";
import DiagnosisTreatment      from "../components/DiagnosisTreatment";
import FHIRRecordUpdate        from "../components/FHIRRecordUpdate";
import PatientNotification     from "../components/PatientNotification";

// API
import { saveConsultation } from "../services/api";

/* ════════════════════════════════════════════════════════════════
   Normal Consultation — Unified Multi-Section Flow
   ════════════════════════════════════════════════════════════════
   Step 1  – Patient Identification     (ID / QR)
   Step 2  – Consent Verification       (status + request)
   Step 3  – Patient Summary            (demographics quick view)
   Step 4  – Medical History Timeline    (past consultations)
   Step 5  – Symptom & Vitals Entry     (complaint, vitals)
   Step 6  – Diagnosis & Treatment      (dx, rx, follow-up)
   Step 7  – FHIR Record Update         (structured save)
   Step 8  – Patient Notification       (notify + actions)
   Step 9  – Audit Logging              (automatic backend)
   ════════════════════════════════════════════════════════════════ */

export default function NormalConsultation({ onBack }) {
  // ── Patient data ──
  const [patientData, setPatientData] = useState(null);

  // ── Step 5 & 6 data ──
  const [vitalsData, setVitalsData]       = useState(null);
  const [diagnosisData, setDiagnosisData] = useState(null);

  // ── Saved consultation ──
  const [savedConsultation, setSavedConsultation] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  // ── Workflow flags ──
  const [consultClosed, setConsultClosed] = useState(false);

  // ── Refs ──
  const diagRef = useRef(null);
  const fhirRef = useRef(null);

  // ────────────────────── Handlers ──────────────────────

  const handlePatientLoaded = (data) => {
    setPatientData(data);
    setVitalsData(null);
    setDiagnosisData(null);
    setSavedConsultation(null);
    setError("");
    setConsultClosed(false);
  };

  /** Step 5 complete — scroll to diagnosis */
  const handleVitalsSaved = (data) => {
    setVitalsData(data);
    setTimeout(() => diagRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
  };

  /** Step 6 complete — auto-save FHIR record */
  const handleDiagnosisSaved = async (data) => {
    setDiagnosisData(data);
    setError("");
    setSaving(true);

    // Merge vitals + diagnosis → consultation payload
    const payload = {
      patient_id: patientData.patient_id,
      ...(vitalsData || {}),
      ...data,
    };

    try {
      const result = await saveConsultation(payload);
      // Rebuild a display object for FHIR preview
      setSavedConsultation({
        ...payload,
        consultation_id: result.consultation_id,
        timestamp: result.timestamp,
        doctor_signature: `Saved at ${new Date(result.timestamp).toLocaleString()}`,
      });
      setTimeout(() => fhirRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (err) {
      setError(err.message || "Failed to save consultation");
    } finally {
      setSaving(false);
    }
  };

  const handleCloseConsult = () => setConsultClosed(true);

  const handleNewConsult = () => {
    setPatientData(null);
    setVitalsData(null);
    setDiagnosisData(null);
    setSavedConsultation(null);
    setError("");
    setConsultClosed(false);
  };

  // ────────────────────── Render ──────────────────────

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex-between mb-4">
        <div>
          <h2 className="page-title">🩺 Normal Consultation</h2>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>Step-by-step patient consultation workflow</p>
        </div>
        <span className={`status-badge ${!patientData ? "badge-neutral" : !vitalsData ? "badge-info" : !savedConsultation ? "badge-warning" : "badge-success"}`}>
          {!patientData
            ? "Waiting for Patient"
            : !vitalsData
            ? "Patient Identified"
            : !savedConsultation
            ? "Data Entry"
            : "Consultation Saved"}
        </span>
      </div>

      {/* ── Closed banner ── */}
      {consultClosed && (
        <div className="success-banner">
          <h3>✅ Consultation Completed</h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Consultation <strong>{savedConsultation?.consultation_id || "—"}</strong> has
            been saved with FHIR-structured records. Audit log entry recorded automatically.
          </p>
          <button onClick={handleNewConsult} className="btn btn-primary btn-lg" style={{ marginTop: 12 }}>
            Start New Consultation
          </button>
        </div>
      )}

      {!consultClosed && (
        <>
          {/* ══════════ STEP 1 — Patient Identification ══════════ */}
          <PatientIdentification onPatientLoaded={handlePatientLoaded} />

          {patientData && (
            <>
              {/* ══════════ STEP 2 — Consent Verification ══════════ */}
              <div className="step-card">
                <h3 className="step-heading"><span className="step-number">2</span> Consent Verification</h3>
                <ConsentStatus patientId={patientData.patient_id} />
                <p className="form-hint">
                  No consent = no data access. Request consent if not yet granted.
                </p>
              </div>

              {/* ══════════ STEP 3 — Patient Summary ══════════ */}
              <PatientSummaryCard patient={patientData} />

              {/* ══════════ STEP 4 — Medical History Viewer ══════════ */}
              <ConsultationTimeline patientId={patientData.patient_id} />

              {/* ══════════ STEP 5 — Symptom & Vitals Entry ══════════ */}
              {!vitalsData ? (
                <SymptomVitalsEntry onSubmit={handleVitalsSaved} />
              ) : (
                <div className="card-success" style={{ borderRadius: "var(--radius)", padding: 20, marginBottom: 16 }}>
                  <h3 className="step-heading"><span className="step-number">✓</span> Vitals Recorded</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--success)" }}>
                    Chief complaint: <strong>{vitalsData.chief_complaint || "—"}</strong>
                    {vitalsData.symptoms?.length > 0 && ` • Symptoms: ${vitalsData.symptoms.join(", ")}`}
                  </p>
                </div>
              )}

              {/* ══════════ STEP 6 — Diagnosis & Treatment ══════════ */}
              <div ref={diagRef}>
                {vitalsData && !diagnosisData && (
                  <DiagnosisTreatment onSubmit={handleDiagnosisSaved} />
                )}
                {diagnosisData && !savedConsultation && saving && (
                  <div className="loading-bar">
                    <div className="spinner" />
                    <span>Saving consultation record…</span>
                  </div>
                )}
                {diagnosisData && savedConsultation && (
                  <div className="card-success" style={{ borderRadius: "var(--radius)", padding: 20, marginBottom: 16 }}>
                    <h3 className="step-heading"><span className="step-number">✓</span> Diagnosis Saved</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--success)" }}>
                      Diagnosis: <strong>{diagnosisData.final_diagnosis || diagnosisData.provisional_diagnosis || "—"}</strong>
                      {diagnosisData.medications_prescribed?.length > 0 &&
                        ` • Rx: ${diagnosisData.medications_prescribed.join(", ")}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && <div className="alert alert-error">{error}</div>}

              {/* ══════════ STEP 7 — FHIR Record Update ══════════ */}
              <div ref={fhirRef}>
                {savedConsultation && <FHIRRecordUpdate consultation={savedConsultation} />}
              </div>

              {/* ══════════ STEP 8 — Patient Notification ══════════ */}
              {savedConsultation && (
                <PatientNotification
                  patientId={patientData.patient_id}
                  consultationId={savedConsultation.consultation_id}
                />
              )}

              {/* ══════════ STEP 9 — Audit Logging ══════════ */}
              {savedConsultation && (
                <div className="card-info" style={{ borderRadius: "var(--radius)", padding: 24, marginBottom: 16 }}>
                  <h3 className="step-heading"><span className="step-number">9</span> Audit Logging</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--primary-dark)" }}>
                    All access events for this consultation have been automatically
                    recorded in the audit log — record viewed, record modified,
                    time &amp; purpose logged.
                  </p>
                  <button onClick={handleCloseConsult} className="btn btn-success" style={{ marginTop: 14 }}>
                    ✅ Close Consultation
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
