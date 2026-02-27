export default function AIResultCard({ data }) {
  if (!data) return null;

  const severity = (data.severity || "").toString();
  const suggested = data.suggested_actions ?? [];

  const confidence = data.confidence_score;
  const confidenceValue =
    confidence && typeof confidence === "object" ? confidence.value : confidence;
  const confidenceNote =
    confidence && typeof confidence === "object" ? confidence.note : null;

  const riskTrend = data.risk_trend;

  const sevClass = severity.toUpperCase() === "CRITICAL"
    ? "severity-critical"
    : severity.toUpperCase() === "HIGH"
    ? "severity-high"
    : severity.toUpperCase() === "MEDIUM"
    ? "severity-moderate"
    : "severity-low";

  return (
    <div className="step-card card-accent">
      <h3 className="step-heading"><span className="step-number">🧠</span> AI Emergency Assessment</h3>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
        <div>
          <div className="form-label">Severity</div>
          <span className={`badge ${sevClass}`} style={{ fontSize: 14, padding: "6px 16px" }}>
            {severity || "N/A"}
          </span>
        </div>
        <div>
          <div className="form-label">Possible Condition</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{data.possible_condition ?? "Unknown"}</div>
        </div>
        <div>
          <div className="form-label">Confidence</div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{confidenceValue ?? "-"}%
            {confidenceNote && <span className="text-secondary" style={{ fontSize: 12, marginLeft: 6 }}>({confidenceNote})</span>}
          </div>
        </div>
        {riskTrend && typeof riskTrend === "object" && (
          <div>
            <div className="form-label">Risk Trend</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{riskTrend.trend ?? "N/A"}
              {riskTrend.risk_direction && <span className="text-secondary" style={{ fontSize: 12, marginLeft: 6 }}>({riskTrend.risk_direction})</span>}
            </div>
          </div>
        )}
      </div>

      <div className="form-label">💡 Suggested Immediate Actions</div>
      <ol style={{ margin: 0, paddingLeft: 20 }}>
        {suggested.map((action, idx) => (
          <li key={idx} style={{ marginBottom: 4, fontSize: 13, lineHeight: 1.5 }}>
            {typeof action === "string" || typeof action === "number"
              ? action
              : action && typeof action === "object"
              ? action.value
                ? action.note
                  ? `${action.value} — ${action.note}`
                  : String(action.value)
                : JSON.stringify(action)
              : String(action)}
          </li>
        ))}
      </ol>
    </div>
  );
}
