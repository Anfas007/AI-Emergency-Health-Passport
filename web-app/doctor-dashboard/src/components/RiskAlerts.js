/**
 * Risk alerts panel — highlights critical warnings
 * based on AI severity + patient allergies / conditions.
 */
export default function RiskAlerts({ aiResult, patient }) {
  if (!aiResult) return null;

  const severity = (aiResult.severity || "").toUpperCase();
  const alerts = [];

  // Severity-based
  if (severity === "CRITICAL")
    alerts.push({ level: "critical", msg: "🔴 CRITICAL severity — immediate intervention required" });
  else if (severity === "MEDIUM")
    alerts.push({ level: "warning", msg: "🟡 MEDIUM severity — close monitoring recommended" });
  else
    alerts.push({ level: "info", msg: "🟢 LOW severity — standard care protocol" });

  // Patient allergy warnings
  const d = patient?.emergency_data || patient || {};
  const allergies = Array.isArray(d.allergies) ? d.allergies : [];
  if (allergies.length > 0)
    alerts.push({ level: "warning", msg: `⚠️ Patient has known allergies: ${allergies.join(", ")}` });

  // Chronic disease warnings
  const chronic = Array.isArray(d.chronic_conditions) ? d.chronic_conditions : [];
  if (chronic.length > 0)
    alerts.push({ level: "warning", msg: `🩺 Chronic conditions present: ${chronic.join(", ")}` });

  // Low confidence
  const confVal = typeof aiResult.confidence_score === "object"
    ? aiResult.confidence_score?.value : aiResult.confidence_score;
  if (confVal !== undefined && confVal < 50)
    alerts.push({ level: "warning", msg: `⚠️ AI confidence is low (${confVal}%) — exercise extra caution` });

  // Risk trend
  const trend = aiResult.risk_trend;
  if (trend && typeof trend === "object" && trend.risk_direction === "worsening")
    alerts.push({ level: "critical", msg: `📈 Risk trend: ${trend.trend || "Worsening"} — escalation likely` });

  if (alerts.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <h4 className="step-heading" style={{ fontSize: 14 }}><span className="step-number">🚨</span> Risk Alerts</h4>
      {alerts.map((a, i) => (
        <div key={i} className={`risk-alert ${a.level === "critical" ? "risk-critical" : a.level === "warning" ? "risk-warning" : "risk-info"}`}>
          {a.msg}
        </div>
      ))}
    </div>
  );
}
