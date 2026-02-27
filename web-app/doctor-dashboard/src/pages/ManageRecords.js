import { useState } from "react";
import { fetchPatientHistory, updateMedicalRecords } from "../services/api";
import MedicalRecordForm from "../components/MedicalRecordForm";
import MedicalHistoryViewer from "../components/MedicalHistoryViewer";
import ConsentStatus from "../components/ConsentStatus";

export default function ManageRecords({ onBack }) {
  const [patientId, setPatientId] = useState("");
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [consentGranted, setConsentGranted] = useState(false);

  const handleFetch = async () => {
    if (!patientId.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");
    setPatientData(null);
    try {
      const data = await fetchPatientHistory(patientId.trim());
      setPatientData(data);
    } catch (err) {
      setError(err.message || "Patient not found");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (recordPayload) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const result = await updateMedicalRecords(patientId.trim(), recordPayload);
      setSuccess(`Records updated successfully (${result.updated_fields.join(", ")})`);
      // Refresh the displayed data
      const refreshed = await fetchPatientHistory(patientId.trim());
      setPatientData(refreshed);
    } catch (err) {
      setError(err.message || "Failed to update records");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="page-title">Manage Medical Records</h2>
      <p className="page-subtitle">Search for a patient and manage their medical records</p>

      {/* Search */}
      <div className="step-card">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            className="form-input"
            placeholder="Enter Patient ID"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={handleFetch} disabled={loading} className="btn btn-primary">
            {loading ? "Loading..." : "Load Patient"}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      {patientData && (
        <>
          <ConsentStatus patientId={patientId.trim()} onConsentChange={setConsentGranted} />

          <div className="step-card">
            <h3 className="step-heading"><span className="step-number">i</span> Patient Info</h3>
            <div className="flex-between" style={{ padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <span className="form-label" style={{ marginBottom: 0 }}>Name</span>
              <span>{patientData.name || "N/A"}</span>
            </div>
            <div className="flex-between" style={{ padding: "8px 0" }}>
              <span className="form-label" style={{ marginBottom: 0 }}>Blood Group</span>
              <span style={{ color: "var(--emergency)", fontWeight: 700 }}>{patientData.blood_group || "N/A"}</span>
            </div>
          </div>

          <MedicalHistoryViewer patientId={patientId.trim()} />

          {consentGranted ? (
            <MedicalRecordForm existingData={patientData} onSave={handleSave} saving={saving} />
          ) : (
            <div className="alert alert-warning">
              <strong>⚠️ Patient consent required</strong>
              <p style={{ margin: "6px 0 0", fontSize: 13 }}>
                You cannot modify medical records without active patient consent.
                Please request consent using the button above and wait for the patient to approve.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
