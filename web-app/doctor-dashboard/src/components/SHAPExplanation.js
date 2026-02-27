export default function SHAPExplanation({ explanation }) {
  if (!explanation) return null;

  const contributions = explanation.contribution_percentages ?? [];

  return (
    <div className="step-card">
      <h3 className="step-heading"><span className="step-number">📊</span> Why AI Predicted This</h3>
      <ul style={{ margin: "0 0 12px", paddingLeft: 20 }}>
        {contributions.map((line, idx) => (
          <li key={idx} style={{ fontSize: 13, marginBottom: 4, lineHeight: 1.5 }}>{line}</li>
        ))}
      </ul>
      {explanation.summary && (
        <p className="form-hint" style={{ fontStyle: "italic", marginTop: 8 }}>{explanation.summary}</p>
      )}
    </div>
  );
}
