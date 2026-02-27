export default function MedicalPassport({ data }) {
  if (!data) return null;

  const renderList = (items) => {
    const list = Array.isArray(items) ? items : items ? [items] : [];
    if (list.length === 0) return <span className="text-muted">None recorded</span>;
    return (
      <ul style={{ margin: "4px 0", paddingLeft: 20 }}>
        {list.map((item, i) => (
          <li key={i}>{typeof item === "string" ? item : JSON.stringify(item)}</li>
        ))}
      </ul>
    );
  };

  return (
    <div className="passport-card">
      <h3 className="step-heading" style={{ color: "var(--primary)" }}>Medical Passport</h3>

      <div className="passport-grid">
        <p><span className="passport-field-label">Name</span> <span className="passport-field-value">{data.name || "N/A"}</span></p>
        <p><span className="passport-field-label">Age</span> <span className="passport-field-value">{data.age || "N/A"}</span></p>
        <p><span className="passport-field-label">Gender</span> <span className="passport-field-value">{data.gender || "N/A"}</span></p>
        <p><span className="passport-field-label">Blood Group</span> <span className="passport-field-value text-danger fw-700">{data.blood_group || "N/A"}</span></p>
      </div>

      <div className="divider" />

      <div style={{ marginBottom: 8 }}>
        <span className="passport-field-label">Allergies</span>
        {renderList(data.allergies)}
      </div>

      <div style={{ marginBottom: 8 }}>
        <span className="passport-field-label">Chronic Conditions</span>
        {renderList(data.chronic_conditions)}
      </div>

      <div style={{ marginBottom: 8 }}>
        <span className="passport-field-label">Current Medications</span>
        {renderList(data.medications)}
      </div>

      <div style={{ marginBottom: 8 }}>
        <span className="passport-field-label">Past Diagnoses</span>
        {renderList(data.past_diagnoses)}
      </div>

      <div style={{ marginBottom: 8 }}>
        <span className="passport-field-label">Previous Emergencies</span>
        {renderList(data.previous_emergencies)}
      </div>
    </div>
  );
}
