import { useState, useEffect } from "react";
import { fetchPatientTimeline } from "../services/api";

const TYPE_STYLES = {
  emergency_access: { icon: "🔓", color: "#d32f2f", label: "Emergency Access" },
  ai_triage: { icon: "🤖", color: "#1976d2", label: "AI Triage" },
};

export default function PatientTimeline({ patientId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (patientId) loadTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const loadTimeline = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchPatientTimeline(patientId);
      setTimeline(result.timeline || []);
    } catch (err) {
      setError(err.message || "Failed to load timeline");
    } finally {
      setLoading(false);
    }
  };

  if (!patientId) return null;

  const style = TYPE_STYLES;

  return (
    <div className="step-card" style={{ marginTop: 20 }}>
      <h3 className="step-heading"><span className="step-number">📅</span> Patient History Timeline</h3>

      {loading && <div className="loading-bar"><div className="spinner" /><span>Loading timeline...</span></div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && timeline.length === 0 && (
        <p className="text-secondary" style={{ textAlign: "center", padding: 16 }}>No timeline events found for this patient.</p>
      )}

      <div className="timeline-container">
        {timeline.length > 0 && <div className="timeline-line" />}

        {timeline.map((event, idx) => {
          const typeInfo = style[event.type] || { icon: "📌", color: "#666", label: event.type };

          return (
            <div key={idx} className="timeline-item">
              <div className="timeline-dot" style={{ background: typeInfo.color, boxShadow: `0 0 0 3px ${typeInfo.color}30` }} />
              <div className="timeline-card" style={{ borderLeft: `4px solid ${typeInfo.color}` }}>
                <div className="flex-between">
                  <strong>{typeInfo.icon} {typeInfo.label}</strong>
                  <span className="text-secondary" style={{ fontSize: 12 }}>{event.timestamp}</span>
                </div>

                {event.type === "emergency_access" && (
                  <p style={{ margin: "6px 0 0", fontSize: 14 }}>{event.detail}</p>
                )}

                {event.type === "ai_triage" && (
                  <div style={{ marginTop: 6, fontSize: 14 }}>
                    <p>
                      <strong>Severity:</strong>{" "}
                      <span className={`badge ${event.severity === "CRITICAL" ? "severity-critical" : "severity-high"}`}>
                        {event.severity}
                      </span>
                      {" "}<strong>Condition:</strong> {event.possible_condition}
                    </p>
                    {event.vitals && (
                      <p className="text-secondary" style={{ fontSize: 13 }}>
                        HR: {event.vitals.heart_rate} | SpO2: {event.vitals.spo2} |
                        BP: {event.vitals.systolic_bp}/{event.vitals.diastolic_bp}
                      </p>
                    )}
                    {event.doctor_decision && (
                      <p style={{ marginTop: 4 }}>
                        <strong>Doctor Decision:</strong>{" "}
                        <span className={event.doctor_decision.decision === "accept" ? "text-success" : "text-danger"}>
                          {event.doctor_decision.decision === "accept" ? "✅ Accepted AI" : "⚠️ Overridden"}
                        </span>
                        {event.doctor_decision.reason && (
                          <span className="text-secondary" style={{ marginLeft: 8, fontStyle: "italic" }}>— {event.doctor_decision.reason}</span>
                        )}
                      </p>
                    )}
                    {event.doctor_notes && (
                      <p className="text-secondary" style={{ marginTop: 4, fontSize: 13 }}>
                        <strong>Notes:</strong> {event.doctor_notes}
                      </p>
                    )}
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
