import { useEffect, useState } from "react";

/**
 * Step 6 — Diagnosis & Treatment Entry
 * Provisional & final diagnosis, treatment plan,
 * medication prescription, follow-up advice.
 */
export default function DiagnosisTreatment({ onSubmit }) {
  const medicineSuggestions = [
    "Paracetamol",
    "Ibuprofen",
    "Aspirin",
    "Amoxicillin",
    "Azithromycin",
    "Cefixime",
    "Metformin",
    "Insulin",
    "Amlodipine",
    "Telmisartan",
    "Losartan",
    "Atorvastatin",
    "Rosuvastatin",
    "Levothyroxine",
    "Pantoprazole",
    "Omeprazole",
    "Cetirizine",
    "Loratadine",
    "Montelukast",
    "Salbutamol",
    "Dolo 650",
    "ORS",
    "Vitamin D",
    "Calcium supplements",
    "Iron supplements",
  ];

  const [form, setForm] = useState({
    provisional_diagnosis: "",
    final_diagnosis: "",
    treatment_plan: "",
    medications_prescribed: "",
    follow_up_advice: "",
    follow_up_date: "",
  });
  const [highlightedMedicationIndex, setHighlightedMedicationIndex] = useState(-1);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const medicationQuery = form.medications_prescribed
    .split(",")
    .slice(-1)[0]
    .trim()
    .toLowerCase();

  const prescribedSet = new Set(
    form.medications_prescribed
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean)
  );

  const medicationMatches = medicationQuery
    ? medicineSuggestions
        .filter(
          (medicine) =>
            medicine.toLowerCase().includes(medicationQuery) &&
            !prescribedSet.has(medicine.toLowerCase())
        )
        .slice(0, 8)
    : [];

  useEffect(() => {
    if (!medicationMatches.length) {
      setHighlightedMedicationIndex(-1);
      return;
    }
    setHighlightedMedicationIndex(0);
  }, [form.medications_prescribed, medicationMatches.length]);

  const applyMedicationSuggestion = (medicine) => {
    const committedItems = form.medications_prescribed
      .split(",")
      .slice(0, -1)
      .map((item) => item.trim())
      .filter(Boolean);

    const alreadyExists = committedItems.some(
      (item) => item.toLowerCase() === medicine.toLowerCase()
    );

    const nextItems = alreadyExists ? committedItems : [...committedItems, medicine];
    set("medications_prescribed", `${nextItems.join(", ")}, `);
    setHighlightedMedicationIndex(-1);
  };

  const handleMedicationKeyDown = (e) => {
    if (!medicationMatches.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedMedicationIndex((prev) =>
        prev < medicationMatches.length - 1 ? prev + 1 : 0
      );
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedMedicationIndex((prev) =>
        prev > 0 ? prev - 1 : medicationMatches.length - 1
      );
      return;
    }

    if (e.key === "Enter" || e.key === "Tab") {
      if (highlightedMedicationIndex >= 0) {
        e.preventDefault();
        applyMedicationSuggestion(medicationMatches[highlightedMedicationIndex]);
      }
      return;
    }

    if (e.key === "Escape") {
      setHighlightedMedicationIndex(-1);
    }
  };

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
          onKeyDown={handleMedicationKeyDown}
          placeholder="e.g. Amoxicillin 500mg TDS, Paracetamol 650mg SOS"
          className="form-textarea" rows={2} />
        {medicationMatches.length > 0 && (
          <div className="medication-suggest-list" role="listbox" aria-label="Medication suggestions">
            {medicationMatches.map((medicine, index) => (
              <button
                key={medicine}
                type="button"
                className={`medication-suggest-item${index === highlightedMedicationIndex ? " active" : ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyMedicationSuggestion(medicine)}
              >
                {medicine}
              </button>
            ))}
          </div>
        )}
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


