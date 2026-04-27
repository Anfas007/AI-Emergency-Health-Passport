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
import { formatLocalDateTime } from "../utils/time";

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
  const [consentGranted, setConsentGranted] = useState(false);

  // ── Refs ──
  const diagRef = useRef(null);
  const fhirRef = useRef(null);

  // ────────────────────── Handlers ──────────────────────

  const handlePatientLoaded = (data) => {
    setPatientData(data);
    setConsentGranted(false);
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
        doctor_signature: `Saved at ${formatLocalDateTime(result.timestamp)}`,
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

  const workflowStage = !patientData
    ? "Patient Identification"
    : !consentGranted
    ? "Consent Verification"
    : !vitalsData
    ? "Vitals & Symptoms"
    : !savedConsultation
    ? "Diagnosis & Treatment"
    : consultClosed
    ? "Consultation Closed"
    : "FHIR & Notification";

  const completedSteps = !patientData
    ? 0
    : !consentGranted
    ? 2
    : !vitalsData
    ? 4
    : !savedConsultation
    ? 6
    : consultClosed
    ? 9
    : 8;

  // ────────────────────── Render ──────────────────────

  return (
    <div className="normal-consultation-page">
      {/* Top Header */}
      <header className="emergency-header">
        <div className="emergency-header-left">
          <div className="emergency-header-title">Health Passport</div>
          <div className="emergency-header-subtitle">AI Emergency Health</div>
        </div>
        <button onClick={onBack} className="emergency-dashboard-btn">Dashboard</button>
      </header>

      {/* Main Content */}
      <main className="normal-main">
        <div className="normal-content">
          {/* Main Heading */}
          <div className="normal-heading-section">
            <h1 className="normal-main-title">Normal Consultation</h1>
            <p className="normal-main-subtitle">
              Step-by-step patient consultation workflow for routine medical assessments.
            </p>
          </div>

          {/* Consultation Overview */}
          <div className="normal-overview-card">
            <div className="normal-overview-main">
              <div className={`normal-status-badge ${!patientData ? "status-neutral" : !vitalsData ? "status-info" : !savedConsultation ? "status-warning" : "status-success"}`}>
                {!patientData
                  ? "Waiting for Patient"
                  : !vitalsData
                  ? "Patient Identified"
                  : !savedConsultation
                  ? "Data Entry"
                  : "Consultation Saved"}
              </div>
              <div className="normal-overview-stage">Current Stage: {workflowStage}</div>
              <p className="normal-overview-note">
                Follow the structured consultation flow to ensure complete and compliant clinical documentation.
              </p>
            </div>

            <div className="normal-overview-stats">
              <div className="normal-overview-stat">
                <span className="normal-overview-stat-label">Workflow Progress</span>
                <span className="normal-overview-stat-value">{completedSteps}/9</span>
              </div>
              <div className="normal-overview-stat">
                <span className="normal-overview-stat-label">Patient ID</span>
                <span className="normal-overview-stat-value">{patientData?.patient_id || "Pending"}</span>
              </div>
            </div>
          </div>

          {/* Closed Banner */}
          {consultClosed && (
            <div className="normal-success-banner">
              <h3>✅ Consultation Completed</h3>
              <p>
                Consultation <strong>{savedConsultation?.consultation_id || "—"}</strong> has
                been saved with FHIR-structured records. Audit log entry recorded automatically.
              </p>
              <button onClick={handleNewConsult} className="normal-new-consult-btn">
                Start New Consultation
              </button>
            </div>
          )}

          {!consultClosed && (
            <div className="normal-workflow-section">
              {/* ══════════ STEP 1 — Patient Identification ══════════ */}
              <div className="normal-step-card">
                <PatientIdentification onPatientLoaded={handlePatientLoaded} />
              </div>

              {patientData && (
                <>
                  {/* ══════════ STEP 2 — Consent Verification ══════════ */}
                  <div className="normal-step-card">
                    <h3 className="normal-step-heading"><span className="normal-step-number">2</span> Consent Verification</h3>
                    <ConsentStatus patientId={patientData.patient_id} onConsentChange={setConsentGranted} />
                    <p className="normal-form-hint">
                      No consent = no data access. Request consent if not yet granted.
                    </p>
                  </div>

                  {!consentGranted && (
                    <div className="normal-step-card" style={{ border: "1px solid #ffd9b8", background: "#fff8f0" }}>
                      <h3 className="normal-step-heading"><span className="normal-step-number">!</span> Consent Required</h3>
                      <p className="normal-form-hint" style={{ marginBottom: 0 }}>
                        Patient must grant consent before viewing history, adding diagnosis, or saving consultation records.
                      </p>
                    </div>
                  )}

                  {/* ══════════ STEP 3 — Patient Summary ══════════ */}
                  {consentGranted && (
                    <div className="normal-step-card">
                      <PatientSummaryCard patient={patientData} />
                    </div>
                  )}

                  {/* ══════════ STEP 4 — Medical History Viewer ══════════ */}
                  {consentGranted && (
                    <div className="normal-step-card">
                      <ConsultationTimeline patientId={patientData.patient_id} />
                    </div>
                  )}

                  {/* ══════════ STEP 5 — Symptom & Vitals Entry ══════════ */}
                  {consentGranted && !vitalsData ? (
                    <div className="normal-step-card">
                      <SymptomVitalsEntry onSubmit={handleVitalsSaved} />
                    </div>
                  ) : consentGranted ? (
                    <div className="normal-success-card">
                      <h3 className="normal-step-heading"><span className="normal-step-number">✓</span> Vitals Recorded</h3>
                      <p className="normal-success-text">
                        Chief complaint: <strong>{vitalsData.chief_complaint || "—"}</strong>
                        {vitalsData.symptoms?.length > 0 && ` • Symptoms: ${vitalsData.symptoms.join(", ")}`}
                      </p>
                    </div>
                  ) : null}

                  {/* ══════════ STEP 6 — Diagnosis & Treatment ══════════ */}
                  {consentGranted && (
                  <div ref={diagRef}>
                    {vitalsData && !diagnosisData && (
                      <div className="normal-step-card">
                        <DiagnosisTreatment onSubmit={handleDiagnosisSaved} />
                      </div>
                    )}
                    {diagnosisData && !savedConsultation && saving && (
                      <div className="normal-loading-bar">
                        <div className="normal-spinner" />
                        <span>Saving consultation record…</span>
                      </div>
                    )}
                    {diagnosisData && savedConsultation && (
                      <div className="normal-success-card">
                        <h3 className="normal-step-heading"><span className="normal-step-number">✓</span> Diagnosis Saved</h3>
                        <p className="normal-success-text">
                          Diagnosis: <strong>{diagnosisData.final_diagnosis || diagnosisData.provisional_diagnosis || "—"}</strong>
                          {diagnosisData.medications_prescribed?.length > 0 &&
                            ` • Rx: ${diagnosisData.medications_prescribed.join(", ")}`}
                        </p>
                      </div>
                    )}
                  </div>
                  )}

                  {/* Error */}
                  {error && <div className="normal-error-banner">{error}</div>}

                  {/* ══════════ STEP 7 — FHIR Record Update ══════════ */}
                  {consentGranted && (
                  <div ref={fhirRef}>
                    {savedConsultation && (
                      <div className="normal-step-card">
                        <FHIRRecordUpdate consultation={savedConsultation} />
                      </div>
                    )}
                  </div>
                  )}

                  {/* ══════════ STEP 8 — Patient Notification ══════════ */}
                  {consentGranted && savedConsultation && (
                    <div className="normal-step-card">
                      <PatientNotification
                        patientId={patientData.patient_id}
                        consultationId={savedConsultation.consultation_id}
                      />
                    </div>
                  )}

                  {/* ══════════ STEP 9 — Audit Logging ══════════ */}
                  {consentGranted && savedConsultation && (
                    <div className="normal-audit-card">
                      <h3 className="normal-step-heading"><span className="normal-step-number">9</span> Audit Logging</h3>
                      <p className="normal-audit-text">
                        All access events for this consultation have been automatically
                        recorded in the audit log — record viewed, record modified,
                        time &amp; purpose logged.
                      </p>
                      <button onClick={handleCloseConsult} className="normal-close-btn">
                        ✅ Close Consultation
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
