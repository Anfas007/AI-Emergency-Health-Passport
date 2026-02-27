import { useState } from "react";

/**
 * Step 6 — Diagnosis & Treatment Entry
 * Provisional & final diagnosis, treatment plan,
 * medication prescription, follow-up advice.
 */
export default function DiagnosisTreatment({ onSubmit }) {
  const [form, setForm] = useState({
    provisional_diagnosis: "",
    final_diagnosis: "",
    treatment_plan: "",
    medications_prescribed: "",
    follow_up_advice: "",
    follow_up_date: "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.final_diagnosis.trim() && !form.provisional_diagnosis.trim()) {
      alert("Please enter at least a provisional or final diagnosis.");
      return;
    }
    const meds = form.medications_prescribed.trim()
      ? form.medications_prescribed.split(",").map(s => s.trim()).filter(Boolean)
      : [];
    onSubmit({
      provisional_diagnosis: form.provisional_diagnosis.trim(),
      final_diagnosis: form.final_diagnosis.trim(),
      treatment_plan: form.treatment_plan.trim(),
      medications_prescribed: meds,
      follow_up_advice: form.follow_up_advice.trim(),
      follow_up_date: form.follow_up_date,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="step-card">
      <h3 className="step-heading"><span className="step-number">6</span> Diagnosis &amp; Treatment</h3>

      <div className="grid-2" style={{ marginBottom: 12 }}>
        <div className="form-group">
          <label className="form-label">Provisional Diagnosis</label>
          <input value={form.provisional_diagnosis}
            onChange={e => set("provisional_diagnosis", e.target.value)}
            placeholder="Initial working diagnosis…"
            className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Final Diagnosis</label>
          <input value={form.final_diagnosis}
            onChange={e => set("final_diagnosis", e.target.value)}
            placeholder="Confirmed diagnosis…"
            className="form-input" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Treatment Plan</label>
        <textarea value={form.treatment_plan}
          onChange={e => set("treatment_plan", e.target.value)}
          placeholder="Describe the treatment approach, procedures, lifestyle advice…"
          className="form-textarea" />
      </div>

      <div className="form-group">
        <label className="form-label">Medications Prescribed</label>
        <textarea value={form.medications_prescribed}
          onChange={e => set("medications_prescribed", e.target.value)}
          placeholder="e.g. Amoxicillin 500mg TDS, Paracetamol 650mg SOS"
          className="form-textarea" rows={2} />
        <small className="form-hint">Separate multiple medications with commas</small>
      </div>

      <div className="grid-2" style={{ marginBottom: 12 }}>
        <div className="form-group">
          <label className="form-label">Follow-up Advice</label>
          <input value={form.follow_up_advice}
            onChange={e => set("follow_up_advice", e.target.value)}
            placeholder="e.g. Review after 1 week, repeat labs…"
            className="form-input" />
        </div>
        <div className="form-group">
          <label className="form-label">Follow-up Date</label>
          <input type="date" value={form.follow_up_date}
            onChange={e => set("follow_up_date", e.target.value)}
            className="form-input" />
        </div>
      </div>

      <button type="submit" className="btn btn-success btn-lg w-full">
        💊 Save Diagnosis &amp; Treatment
      </button>
    </form>
  );
}


