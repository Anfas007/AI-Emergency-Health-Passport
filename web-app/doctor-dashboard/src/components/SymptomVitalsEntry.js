import { useState } from "react";

const SYMPTOM_CHIPS = [
  "Fever", "Cough", "Headache", "Body ache", "Fatigue",
  "Nausea", "Vomiting", "Diarrhea", "Sore throat", "Congestion",
  "Chest pain", "Shortness of breath", "Dizziness", "Rash", "Joint pain",
];

/**
 * Step 5 — Current Complaint & Vitals Entry
 * Patient-reported symptoms, vital signs (non-emergency),
 * reason for visit, clinical observations.
 */
export default function SymptomVitalsEntry({ onSubmit }) {
  const [form, setForm] = useState({
    chief_complaint: "",
    reason_for_visit: "",
    clinical_observations: "",
    heart_rate: "",
    blood_pressure_sys: "",
    blood_pressure_dia: "",
    temperature: "",
    spo2: "",
    respiratory_rate: "",
    weight: "",
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
    const bp = (form.blood_pressure_sys && form.blood_pressure_dia)
      ? `${form.blood_pressure_sys}/${form.blood_pressure_dia}`
      : "";
    onSubmit({
      chief_complaint: form.chief_complaint.trim(),
      reason_for_visit: form.reason_for_visit.trim(),
      symptoms: selectedSymptoms,
      clinical_observations: form.clinical_observations.trim(),
      heart_rate: Number(form.heart_rate) || null,
      blood_pressure: bp || null,
      temperature: Number(form.temperature) || null,
      spo2: Number(form.spo2) || null,
      respiratory_rate: Number(form.respiratory_rate) || null,
      weight: Number(form.weight) || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="step-card">
      <h3 className="step-heading"><span className="step-number">5</span> Current Complaint &amp; Vitals</h3>

      <div className="form-group">
        <label className="form-label">Chief Complaint</label>
        <input value={form.chief_complaint} onChange={e => set("chief_complaint", e.target.value)}
          placeholder="Primary complaint in patient's words…"
          className="form-input" />
      </div>

      <div className="form-group">
        <label className="form-label">Reason for Visit</label>
        <input value={form.reason_for_visit} onChange={e => set("reason_for_visit", e.target.value)}
          placeholder="e.g. Follow-up, New complaint, Routine checkup"
          className="form-input" />
      </div>

      <div className="form-group">
        <label className="form-label">Reported Symptoms</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {SYMPTOM_CHIPS.map(s => (
            <button type="button" key={s}
              onClick={() => toggleSymptom(s)}
              className={`chip ${selectedSymptoms.includes(s) ? "chip-active" : "chip-default"}`}
            >{s}</button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Vital Signs</label>
        <div className="vitals-grid">
          <VitalInput label="Heart Rate" value={form.heart_rate} onChange={v => set("heart_rate", v)} unit="bpm" />
          <div>
            <div className="form-label">Blood Pressure</div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <input type="number" value={form.blood_pressure_sys}
                onChange={e => set("blood_pressure_sys", e.target.value)}
                className="form-input" style={{ width: 60 }} placeholder="Sys" />
              <span>/</span>
              <input type="number" value={form.blood_pressure_dia}
                onChange={e => set("blood_pressure_dia", e.target.value)}
                className="form-input" style={{ width: 60 }} placeholder="Dia" />
              <span className="text-muted" style={{ fontSize: 11 }}>mmHg</span>
            </div>
          </div>
          <VitalInput label="Temperature" value={form.temperature} onChange={v => set("temperature", v)} unit="°C" />
          <VitalInput label="SpO₂" value={form.spo2} onChange={v => set("spo2", v)} unit="%" />
          <VitalInput label="Resp. Rate" value={form.respiratory_rate} onChange={v => set("respiratory_rate", v)} unit="/min" />
          <VitalInput label="Weight" value={form.weight} onChange={v => set("weight", v)} unit="kg" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Clinical Observations</label>
        <textarea value={form.clinical_observations}
          onChange={e => set("clinical_observations", e.target.value)}
          placeholder="Doctor's clinical observations during examination…"
          className="form-textarea" />
      </div>

      <button type="submit" className="btn btn-primary btn-lg w-full">
        ✅ Save Complaint &amp; Vitals
      </button>
    </form>
  );
}

function VitalInput({ label, value, onChange, unit }) {
  return (
    <div>
      <div className="form-label">{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input type="number" value={value}
          onChange={e => onChange(e.target.value)}
          className="form-input" placeholder="—" />
        <span className="text-muted" style={{ fontSize: 11 }}>{unit}</span>
      </div>
    </div>
  );
}


