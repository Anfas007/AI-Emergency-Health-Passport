import { useState, useRef } from "react";

// Sub-components
import EmergencyQRAccess from "../components/EmergencyQRAccess";
import PatientSnapshot   from "../components/PatientSnapshot";
import EmergencyForm     from "../components/EmergencyForm";
import AIResultCard      from "../components/AIResultCard";
import RiskAlerts        from "../components/RiskAlerts";
import SHAPExplanation   from "../components/SHAPExplanation";
import SuggestedActions   from "../components/SuggestedActions";
import DoctorNotes       from "../components/DoctorNotes";
import DoctorDecision    from "../components/DoctorDecision";

// API
import {
  runEmergencyAI,
  postDoctorDecision,
  postDoctorNotes,
} from "../services/api";

/* ================================================================
   Emergency Consultation — Unified Multi-Section Flow
   ================================================================
   Step 1  – Emergency QR Access    (scan / token)
   Step 2  – Patient Snapshot       (identity + medical profile)
   Step 3  – Live Vitals Entry      (form: vitals, symptoms)
   Step 4  – AI Triage Trigger      (submit → run AI)
   Step 5  – Severity & Confidence  (color-coded badge)
   Step 6  – Risk Alerts            (dynamic alert cards)
   Step 7  – Explainable AI         (SHAP contributions)
   Step 8  – Suggested Actions      (actionable list)
   Step 9  – Doctor Notes & Decision
   Step 10 – Emergency Record Storage (via backend)
   Step 11 – Audit Logging           (automatic backend)
   ================================================================ */

export default function EmergencyConsultation({ onBack }) {
  // ── Patient from QR scan ──
  const [patientData, setPatientData] = useState(null);

  // ── AI results ──
  const [aiResult, setAiResult]   = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  // ── Doctor workflow flags ──
  const [notesSaved, setNotesSaved]       = useState(false);
  const [decisionSaved, setDecisionSaved] = useState(false);
  const [consultClosed, setConsultClosed] = useState(false);

  // ── Scroll refs ──
  const resultRef = useRef(null);

  // ────────────────────────── Handlers ──────────────────────────

  /** Step 1 complete — patient identified via QR/token */
  const handlePatientLoaded = (scanResult) => {
    setPatientData(scanResult);
    setAiResult(null);
    setSessionId(null);
    setNotesSaved(false);
    setDecisionSaved(false);
    setConsultClosed(false);
    setError("");
  };

  /** Step 3 + 4 — vitals submitted → run AI triage */
  const handleRunAI = async (formPayload) => {
    setError("");
    setLoading(true);
    setAiResult(null);
    setDecisionSaved(false);
    setNotesSaved(false);
    setConsultClosed(false);
    try {
      const result = await runEmergencyAI(formPayload);
      const assessment = result?.ai_assessment ?? result;
      setAiResult(assessment);
      setSessionId(result?.session_id ?? null);
      // Scroll to results
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (err) {
      setError(err.message || "AI triage request failed");
    } finally {
      setLoading(false);
    }
  };

  /** Step 9a — save notes */
  const handleSaveNotes = async (notesPayload) => {
    try {
      await postDoctorNotes({ ...notesPayload, session_id: sessionId });
      setNotesSaved(true);
    } catch (err) {
      console.error("Failed to save doctor notes", err);
    }
  };

  /** Step 9b — save decision (accept / override) */
  const handleDoctorConfirm = async (decisionPayload) => {
    try {
      await postDoctorDecision({
        ...decisionPayload,
        session_id: sessionId,
        severity: aiResult?.severity ?? "",
        possible_condition: aiResult?.possible_condition ?? "",
      });
      setDecisionSaved(true);
    } catch (err) {
      console.error("Failed to post doctor decision", err);
    }
  };

  /** Close consultation — reset everything */
  const handleCloseConsult = () => {
    setConsultClosed(true);
  };

  const handleNewConsult = () => {
    setPatientData(null);
    setAiResult(null);
    setSessionId(null);
    setLoading(false);
    setError("");
    setNotesSaved(false);
    setDecisionSaved(false);
    setConsultClosed(false);
  };

  // ────────────────────────── Severity helpers ──────────────────────────

  const severityClass = (sev) => {
    const s = (sev || "").toUpperCase();
    if (s === "CRITICAL") return "severity-critical";
    if (s === "HIGH") return "severity-high";
    if (s === "MODERATE") return "severity-moderate";
    return "severity-low";
  };

  // ────────────────────────── Render ──────────────────────────

  return (
    <div className="animate-fade-in">
      {/* Status badge */}
      <div className="flex-between mb-4">
        <div>
          <h2 className="page-title">🚨 Emergency Consultation</h2>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>AI-assisted emergency triage workflow</p>
        </div>
        <span className={`status-badge ${!patientData ? "badge-neutral" : !aiResult ? "badge-info" : "badge-success"}`}>
          {!patientData ? "Waiting for Patient" : !aiResult ? "Patient Identified" : "AI Triage Complete"}
        </span>
      </div>

      {/* ── Completed / closed banner ── */}
      {consultClosed && (
        <div className="success-banner">
          <h3>✅ Emergency Consultation Completed</h3>
          <p style={{ color: "var(--text-secondary)" }}>Session <strong>{sessionId || "—"}</strong> has been recorded. Audit log entry created automatically.</p>
          <button onClick={handleNewConsult} className="btn btn-primary btn-lg" style={{ marginTop: 12 }}>
            Start New Emergency Consultation
          </button>
        </div>
      )}

      {!consultClosed && (
        <>
          {/* ══════════ STEP 1 — Emergency QR Access ══════════ */}
          <EmergencyQRAccess onPatientLoaded={handlePatientLoaded} />

          {/* ══════════ STEP 2 — Patient Snapshot ══════════ */}
          {patientData && <PatientSnapshot patient={patientData} />}

          {/* ══════════ STEP 3+4 — Live Vitals & AI Triage Trigger ══════════ */}
          {patientData && (
            <EmergencyForm onSubmit={handleRunAI} patientId={patientData.patient_id || ""} />
          )}

          {/* Loading */}
          {loading && (
            <div className="loading-bar">
              <div className="spinner" />
              <span>Running AI Triage…</span>
            </div>
          )}

          {/* Error */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* ══════════ AI RESULTS (Steps 5-8) ══════════ */}
          {aiResult && (
            <div ref={resultRef}>

              {/* ── Step 5 — Severity & Confidence ── */}
              <div className="step-card">
                <h3 className="step-heading"><span className="step-number">5</span> Severity &amp; Confidence</h3>
                <div className="flex gap-4" style={{ alignItems: "center", flexWrap: "wrap" }}>
                  <span className={severityClass(aiResult.severity)}>
                    {(aiResult.severity || "UNKNOWN").toUpperCase()}
                  </span>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Possible Condition</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{aiResult.possible_condition || "—"}</div>
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Confidence</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)" }}>
                      {aiResult.confidence_score?.value != null
                        ? `${(aiResult.confidence_score.value * 100).toFixed(0)}%`
                        : "—"}
                    </div>
                    {aiResult.confidence_score?.note && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{aiResult.confidence_score.note}</div>
                    )}
                  </div>
                </div>
                {aiResult.risk_trend && (
                  <div style={{ marginTop: 12, fontSize: 13, color: "var(--text-secondary)" }}>
                    📈 Trend: <strong>{aiResult.risk_trend.trend}</strong>
                    {aiResult.risk_trend.risk_direction && ` — ${aiResult.risk_trend.risk_direction}`}
                  </div>
                )}
              </div>

              {/* ── Step 6 — Risk Alerts ── */}
              <RiskAlerts aiResult={aiResult} patient={patientData} />

              {/* ── Step 7 — Explainable AI (SHAP) ── */}
              {aiResult.explanation && (
                <div className="step-card">
                  <h3 className="step-heading"><span className="step-number">7</span> Explainable AI (SHAP)</h3>
                  <SHAPExplanation explanation={aiResult.explanation} />
                </div>
              )}

              {/* ── Step 8 — Suggested Actions ── */}
              <SuggestedActions actions={aiResult.suggested_actions} />

              {/* legacy detail card */}
              <AIResultCard data={aiResult} />

              {/* ══════════ STEP 9 — Doctor Notes & Decision ══════════ */}
              <div className="step-card">
                <h3 className="step-heading"><span className="step-number">9</span> Doctor Notes &amp; Decision</h3>

                <DoctorNotes onSave={handleSaveNotes} />
                {notesSaved && <p className="alert alert-success" style={{ marginTop: 8 }}>✅ Doctor notes saved.</p>}

                <hr style={{ margin: "16px 0", border: "none", borderTop: "1px solid var(--border)" }} />

                <DoctorDecision onConfirm={handleDoctorConfirm} />
                {decisionSaved && <p className="alert alert-success" style={{ marginTop: 8 }}>✅ Decision confirmed and saved.</p>}
              </div>

              {/* ══════════ STEP 10+11 — Record Storage & Audit ══════════ */}
              {decisionSaved && (
                <div className="card-success" style={{ borderRadius: "var(--radius)", padding: 24, marginBottom: 16 }}>
                  <h3 className="step-heading"><span className="step-number">✓</span> Record Storage &amp; Audit</h3>
                  <p style={{ margin: 0, color: "var(--success)" }}>
                    Emergency session <strong>{sessionId || "—"}</strong> has been securely stored.
                    An audit log entry has been recorded automatically.
                  </p>
                  <button onClick={handleCloseConsult} className="btn btn-success" style={{ marginTop: 14 }}>
                    ✅ Close Emergency Consultation
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
