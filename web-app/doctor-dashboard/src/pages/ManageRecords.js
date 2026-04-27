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
    <div className="manage-records-page">
      {/* Top Header */}
      <header className="emergency-header">
        <div className="emergency-header-left">
          <div className="emergency-header-title">Health Passport</div>
          <div className="emergency-header-subtitle">AI Emergency Health</div>
        </div>
        <button onClick={onBack} className="emergency-dashboard-btn">Dashboard</button>
      </header>

      {/* Main Content */}
      <main className="manage-main">
        <div className="manage-content">
          {/* Main Heading */}
          <div className="manage-heading-section">
            <h1 className="manage-main-title">Manage Medical Records</h1>
            <p className="manage-main-subtitle">
              Search for a patient and manage their medical records with secure access controls.
            </p>
          </div>

          {/* Search Section */}
          <div className="manage-search-card">
            <div className="manage-search-form">
              <input
                className="manage-search-input"
                placeholder="Enter Patient ID"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
              <button onClick={handleFetch} disabled={loading} className="manage-search-btn">
                {loading ? "Loading..." : "Load Patient"}
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {error && <div className="manage-error-banner">{error}</div>}
          {success && <div className="manage-success-banner">✅ {success}</div>}

          {/* Patient Data */}
          {patientData && (
            <div className="manage-patient-section">
              {/* Consent Status */}
              <div className="manage-consent-card">
                <ConsentStatus patientId={patientId.trim()} onConsentChange={setConsentGranted} />
              </div>

              {/* Patient Info */}
              <div className="manage-info-card">
                <h3 className="manage-card-title">
                  <span className="manage-icon">👤</span> Patient Information
                </h3>
                <div className="manage-info-grid">
                  <div className="manage-info-row">
                    <span className="manage-info-label">Name</span>
                    <span className="manage-info-value">{patientData.name || "N/A"}</span>
                  </div>
                  <div className="manage-info-row">
                    <span className="manage-info-label">Blood Group</span>
                    <span className="manage-info-value manage-blood-group">{patientData.blood_group || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Medical History */}
              <div className="manage-history-card">
                <MedicalHistoryViewer patientId={patientId.trim()} />
              </div>

              {/* Record Management */}
              {consentGranted ? (
                <div className="manage-form-card">
                  <MedicalRecordForm existingData={patientData} onSave={handleSave} saving={saving} />
                </div>
              ) : (
                <div className="manage-consent-warning">
                  <div className="manage-warning-icon">⚠️</div>
                  <h3>Patient Consent Required</h3>
                  <p>
                    You cannot modify medical records without active patient consent.
                    Please request consent using the button above and wait for the patient to approve.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
