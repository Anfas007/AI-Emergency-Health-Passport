import { useState } from "react";

const CONSCIOUSNESS = ["Alert", "Verbal", "Pain", "Unresponsive"];

const SYMPTOMS = [
  "Chest pain", "Difficulty breathing", "Severe bleeding",
  "Seizure / Convulsions", "Loss of consciousness", "Severe headache",
  "Abdominal pain", "High fever", "Trauma / Injury", "Allergic reaction",
];

/**
 * Live vitals + symptoms entry form for emergency consultation.
 * Calls onSubmit(payload) with numeric vitals + condition_text.
 */
export default function EmergencyForm({ onSubmit, patientId }) {
  const [form, setForm] = useState({
    age: "", heart_rate: "", spo2: "",
    systolic_bp: "", diastolic_bp: "",
    temperature: "", consciousness: "Alert",
    condition_text: "", patient_id: patientId || "",
  });
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleSymptom = (s) => {
    setSelectedSymptoms(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const conditionParts = [];
    if (selectedSymptoms.length) conditionParts.push(selectedSymptoms.join(", "));
    if (form.condition_text.trim()) conditionParts.push(form.condition_text.trim());
    const condition_text = conditionParts.join(". ") || "General emergency";

    onSubmit({
      age: Number(form.age) || 0,
      heart_rate: Number(form.heart_rate) || 0,
      spo2: Number(form.spo2) || 0,
      systolic_bp: Number(form.systolic_bp) || 0,
      diastolic_bp: Number(form.diastolic_bp) || 0,
      temperature: Number(form.temperature) || 0,
      consciousness: form.consciousness,
      condition_text,
      patient_id: form.patient_id,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="step-card">
      <h3 className="step-heading"><span className="step-number">3</span> Live Vitals &amp; Symptoms</h3>

      {/* Vitals grid */}
      <div className="vitals-grid" style={{ marginBottom: 12 }}>
        <VitalInput label="Age" name="age" value={form.age} onChange={set} unit="yrs" />
        <VitalInput label="Heart Rate" name="heart_rate" value={form.heart_rate} onChange={set} unit="bpm" />
        <VitalInput label="SpO₂" name="spo2" value={form.spo2} onChange={set} unit="%" />
        <VitalInput label="Systolic BP" name="systolic_bp" value={form.systolic_bp} onChange={set} unit="mmHg" />
        <VitalInput label="Diastolic BP" name="diastolic_bp" value={form.diastolic_bp} onChange={set} unit="mmHg" />
        <VitalInput label="Temperature" name="temperature" value={form.temperature} onChange={set} unit="°C" />
      </div>

      {/* Consciousness */}
      <div className="form-group">
        <label className="form-label">Consciousness Level (AVPU)</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CONSCIOUSNESS.map(c => (
            <button type="button" key={c}
              onClick={() => set("consciousness", c)}
              className={`chip ${form.consciousness === c ? "chip-active" : "chip-default"}`}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* Emergency symptoms */}
      <div className="form-group">
        <label className="form-label">Emergency Symptoms</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SYMPTOMS.map(s => (
            <button type="button" key={s}
              onClick={() => toggleSymptom(s)}
              className={`chip ${selectedSymptoms.includes(s) ? "chip-emergency-active" : "chip-emergency"}`}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Free-text */}
      <div className="form-group">
        <label className="form-label">Additional Condition / Notes</label>
        <textarea value={form.condition_text} onChange={e => set("condition_text", e.target.value)}
          placeholder="Any additional clinical context…"
          className="form-textarea" />
      </div>

      <input type="hidden" value={form.patient_id} />

      <button type="submit" className="btn btn-primary btn-lg w-full">
        🧠 Run AI Triage
      </button>
    </form>
  );
}

function VitalInput({ label, name, value, onChange, unit }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input type="number" value={value} onChange={e => onChange(name, e.target.value)}
          className="form-input" placeholder="—" />
        <span className="text-muted" style={{ fontSize: 11 }}>{unit}</span>
      </div>
    </div>
  );
}
