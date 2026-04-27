import { useState, useEffect } from "react";
import { fetchConsultationHistory, fetchPatientMedicalHistory } from "../services/api";
import { formatLocalDateTime, parseUtcToLocalDate } from "../utils/time";

/**
 * Step 4 — Medical History
 * Visit-wise medical timeline with diagnoses, prescriptions,
 * lab data, and FHIR-structured records, plus patient-uploaded records.
 */
export default function ConsultationTimeline({ patientId }) {
  const [doctorRecords, setDoctorRecords] = useState([]);
  const [uploadedRecords, setUploadedRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedDoctor, setExpandedDoctor] = useState(null);
  const [expandedUpload, setExpandedUpload] = useState(null);

  const BACKEND_BASE = "http://localhost:8000";

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    setError("");

    Promise.all([
      fetchConsultationHistory(patientId),
      fetchPatientMedicalHistory(patientId)
    ])
      .then(([consultRes, medicalRes]) => {
        const consultations = asArray(consultRes.consultations).sort((a, b) => {
          const aTime = parseUtcToLocalDate(a.timestamp || a.created_at) || new Date(0);
          const bTime = parseUtcToLocalDate(b.timestamp || b.created_at) || new Date(0);
          return bTime - aTime;
        });
        const medicalHistory = medicalRes.medical_history || {};
        const surgeryList = asArray(medicalHistory.surgeries);
        const uploadedList = asArray(medicalHistory.uploaded_records);

        const mappedUploads = uploadedList.map((rec, idx) => {
          const inferredCategory = mapUploadCategory(rec?.type || rec?.title || rec?.description || "");
          return {
            id: rec?.record_id || `upload-${idx}`,
            category: inferredCategory,
            title: rec?.title || "Medical Record",
            description: rec?.description || "",
            date: rec?.date || rec?.uploaded_at || "",
            file_url: rec?.file_url || "",
            type: rec?.type || "",
          };
        });

        // Include surgery history even if no file was uploaded for it.
        surgeryList.forEach((surgery, idx) => {
          mappedUploads.push({
            id: surgery?.record_id || `surgical-history-${idx}`,
            category: "surgical_history",
            title: surgery?.title || surgery?.name || "Surgical History",
            description: surgery?.description || surgery?.details || "",
            date: surgery?.date || "",
            file_url: surgery?.file_url || "",
            type: surgery?.type || "surgery",
          });
        });

        const uniqueUploads = dedupeUploadRecords(mappedUploads).sort((a, b) => {
          const aTime = parseUtcToLocalDate(a.date) || new Date(0);
          const bTime = parseUtcToLocalDate(b.date) || new Date(0);
          return bTime - aTime;
        });

        setDoctorRecords(consultations);
        setUploadedRecords(uniqueUploads);
      })
      .catch(err => setError(err.message || "Failed to load history"))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (!patientId) return null;

  return (
    <div className="step-card">
      <h3 className="step-heading"><span className="step-number">4</span> Medical History</h3>

      {loading && <div className="loading-bar"><div className="spinner" /><span>Loading medical history…</span></div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && doctorRecords.length === 0 && uploadedRecords.length === 0 && !error && (
        <p className="text-muted" style={{ fontStyle: "italic", textAlign: "center", padding: 16 }}>No medical history records found.</p>
      )}

      {!loading && !error && (
        <>
          <div className="step-card" style={{ marginBottom: 12, border: "1px solid #e5e7eb" }}>
            <h4 className="step-heading" style={{ marginBottom: 10 }}>
              Doctor-recorded consultations ({doctorRecords.length})
            </h4>
            {doctorRecords.length === 0 ? (
              <p className="text-muted" style={{ margin: 0 }}>No doctor-recorded consultations found.</p>
            ) : (
              <div className="timeline">
                {doctorRecords.map((r, idx) => {
                  const isOpen = expandedDoctor === idx;
                  const obs = r.observation || {};
                  const cond = r.condition || {};
                  const med = r.medication_request || {};
                  const fu = r.follow_up || {};
                  const vitals = obs.vitals || {};

                  return (
                    <div key={r.consultation_id || idx} className="timeline-entry">
                      <div className="timeline-dot-col">
                        <div className="timeline-dot" />
                        {idx < doctorRecords.length - 1 && <div className="timeline-line" />}
                      </div>

                      <div className="timeline-content">
                        <div className="timeline-header" onClick={() => setExpandedDoctor(isOpen ? null : idx)}>
                          <div>
                            <span className="text-muted" style={{ fontSize: 11, marginRight: 8 }}>{formatDate(r.timestamp)}</span>
                            <span className="text-primary fw-600" style={{ fontSize: 11 }}>{r.consultation_id || "Consultation"}</span>
                          </div>
                          <div style={{ fontSize: 13 }}>
                            <strong>{cond.final_diagnosis || cond.provisional_diagnosis || "No diagnosis"}</strong>
                          </div>
                          <span className="text-secondary" style={{ fontSize: 12, marginLeft: "auto" }}>
                            Dr. {r.doctor_name || "—"}
                          </span>
                          <span className="text-muted" style={{ fontSize: 12, marginLeft: 8 }}>{isOpen ? "▲" : "▼"}</span>
                        </div>

                        {isOpen && (
                          <div className="timeline-details">
                            <Section title="📋 Observation">
                              {obs.chief_complaint && <Row label="Chief Complaint" value={obs.chief_complaint} />}
                              {obs.reason_for_visit && <Row label="Reason" value={obs.reason_for_visit} />}
                              {(obs.symptoms || []).length > 0 && <Row label="Symptoms" value={obs.symptoms.join(", ")} />}
                              {obs.clinical_observations && <Row label="Clinical Obs." value={obs.clinical_observations} />}
                              {hasVitals(vitals) && <Row label="Vitals" value={formatVitals(vitals)} />}
                            </Section>

                            <Section title="🩺 Condition">
                              {cond.provisional_diagnosis && <Row label="Provisional" value={cond.provisional_diagnosis} />}
                              {cond.final_diagnosis && <Row label="Final" value={cond.final_diagnosis} />}
                            </Section>

                            <Section title="💊 Medication">
                              {med.treatment_plan && <Row label="Treatment" value={med.treatment_plan} />}
                              {(med.medications_prescribed || []).length > 0 && (
                                <Row label="Medications" value={med.medications_prescribed.join(", ")} />
                              )}
                            </Section>

                            {(fu.advice || fu.date) && (
                              <Section title="📅 Follow-up">
                                {fu.advice && <Row label="Advice" value={fu.advice} />}
                                {fu.date && <Row label="Date" value={fu.date} />}
                              </Section>
                            )}

                            <div className="text-muted" style={{ fontSize: 11, marginTop: 8 }}>
                              ✍️ {r.doctor_signature || "—"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="step-card" style={{ border: "1px solid #e5e7eb" }}>
            <h4 className="step-heading" style={{ marginBottom: 10 }}>
              Patient-uploaded information ({uploadedRecords.length})
            </h4>
            <p className="text-muted" style={{ marginTop: 0, marginBottom: 12 }}>
              Categories: Lab reports, Prescriptions, Scan results, Surgical history.
            </p>
            {uploadedRecords.length === 0 ? (
              <p className="text-muted" style={{ margin: 0 }}>No patient-uploaded records found.</p>
            ) : (
              <div className="timeline">
                {uploadedRecords.map((record, idx) => {
                  const isOpen = expandedUpload === idx;
                  const canOpenFile = Boolean(record.file_url);

                  return (
                    <div key={record.id || idx} className="timeline-entry">
                      <div className="timeline-dot-col">
                        <div className="timeline-dot" />
                        {idx < uploadedRecords.length - 1 && <div className="timeline-line" />}
                      </div>

                      <div className="timeline-content">
                        <div className="timeline-header" onClick={() => setExpandedUpload(isOpen ? null : idx)}>
                          <div>
                            <span className="text-muted" style={{ fontSize: 11, marginRight: 8 }}>{formatDate(record.date)}</span>
                            <span className="text-primary fw-600" style={{ fontSize: 11 }}>{formatCategory(record.category)}</span>
                          </div>
                          <div style={{ fontSize: 13 }}><strong>{record.title}</strong></div>
                          <span className="text-secondary" style={{ fontSize: 12, marginLeft: "auto" }}>Patient Uploaded</span>
                          <span className="text-muted" style={{ fontSize: 12, marginLeft: 8 }}>{isOpen ? "▲" : "▼"}</span>
                        </div>

                        {isOpen && (
                          <div className="timeline-details">
                            <Section title="📄 Uploaded Record">
                              <Row label="Category" value={formatCategory(record.category)} />
                              {record.type && <Row label="Original Type" value={record.type} />}
                              {record.description && <Row label="Description" value={record.description} />}
                              {record.date && <Row label="Date" value={record.date} />}
                            </Section>

                            {canOpenFile && (
                              <button
                                className="btn btn-primary"
                                type="button"
                                onClick={() => window.open(buildFileUrl(BACKEND_BASE, record.file_url), "_blank", "noopener,noreferrer")}
                              >
                                Open File (PDF/Image)
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="text-primary fw-700" style={{ fontSize: 13, marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ fontSize: 13, marginBottom: 2 }}>
      <span className="text-muted">{label}: </span>
      <span>{value}</span>
    </div>
  );
}

function hasVitals(v) {
  return v && (v.heart_rate || v.blood_pressure || v.temperature || v.spo2 || v.respiratory_rate || v.weight);
}

function formatVitals(v) {
  const parts = [];
  if (v.heart_rate) parts.push(`HR ${v.heart_rate}`);
  if (v.blood_pressure) parts.push(`BP ${v.blood_pressure}`);
  if (v.temperature) parts.push(`${v.temperature}°C`);
  if (v.spo2) parts.push(`SpO₂ ${v.spo2}%`);
  if (v.respiratory_rate) parts.push(`RR ${v.respiratory_rate}`);
  if (v.weight) parts.push(`${v.weight} kg`);
  return parts.join("  •  ");
}

function formatDate(ts) {
  if (!ts) return "—";
  return formatLocalDateTime(ts, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    return trimmed.includes(",")
      ? trimmed.split(",").map((x) => x.trim()).filter(Boolean)
      : [trimmed];
  }
  if (typeof value === "object") return [value];
  return [String(value)];
}

function mapUploadCategory(value) {
  const text = String(value || "").toLowerCase();
  if (text.includes("lab")) return "lab_reports";
  if (text.includes("prescription") || text.includes("rx")) return "prescriptions";
  if (text.includes("scan") || text.includes("xray") || text.includes("x-ray") || text.includes("mri") || text.includes("ct") || text.includes("ultrasound")) {
    return "scan_results";
  }
  if (text.includes("surgery") || text.includes("surgical") || text.includes("operation")) return "surgical_history";
  return "other";
}

function formatCategory(category) {
  const map = {
    lab_reports: "Lab Reports",
    prescriptions: "Prescriptions",
    scan_results: "Scan Results",
    surgical_history: "Surgical History",
    other: "Other Records",
  };
  return map[category] || "Other Records";
}

function buildFileUrl(base, filePath) {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  return `${base}${filePath.startsWith("/") ? "" : "/"}${filePath}`;
}

function dedupeUploadRecords(records) {
  const seen = new Set();
  const out = [];
  records.forEach((rec) => {
    const key = `${rec.id}|${rec.category}|${rec.title}|${rec.date}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(rec);
    }
  });
  return out;
}


