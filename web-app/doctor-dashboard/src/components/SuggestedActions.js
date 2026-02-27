/**
 * Suggested immediate actions list from the AI engine.
 */
export default function SuggestedActions({ actions }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="card card-warning">
      <h4 className="step-heading" style={{ fontSize: 14 }}><span className="step-number">💡</span> Suggested Immediate Actions</h4>
      <ol style={{ margin: 0, paddingLeft: 20 }}>
        {actions.map((a, i) => (
          <li key={i} style={{ marginBottom: 4, fontSize: 13, lineHeight: 1.5 }}>
            {typeof a === "string" || typeof a === "number"
              ? a
              : a && typeof a === "object"
                ? a.value
                  ? a.note ? `${a.value} — ${a.note}` : String(a.value)
                  : JSON.stringify(a)
                : String(a)}
          </li>
        ))}
      </ol>
      <p className="form-hint" style={{ fontStyle: "italic", marginTop: 10 }}>
        ⚠️ These are AI-generated suggestions only. Final clinical decisions rest with the treating physician.
      </p>
    </div>
  );
}
