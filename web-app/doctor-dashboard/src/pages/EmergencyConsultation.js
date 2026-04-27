import { useEffect, useState } from "react";
import EmergencyQRAccess from "../components/EmergencyQRAccess";

export default function EmergencyConsultation({ onBack }) {
  const [patientData, setPatientData] = useState(null);
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);

  const profile = patientData?.profile || {};
  const emergencyData = patientData?.emergency_data || {};
  const medicalHistory = patientData?.medical_history || {};
  const alerts = patientData?.important_alerts?.alerts || [];
  const summary = patientData?.emergency_summary?.summary || {};

  useEffect(() => {
    setPhotoLoadFailed(false);
  }, [patientData]);

  const firstNonEmpty = (...values) => {
    for (const value of values) {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed) return trimmed;
      }
    }
    return "";
  };

  const buildAbsoluteUrl = (url) => {
    const raw = (url || "").trim();
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw) || raw.startsWith("data:")) return raw;
    const base = (process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
    return `${base}${raw.startsWith("/") ? "" : "/"}${raw}`;
  };

  const asList = (value) => {
    if (Array.isArray(value)) {
      return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
    }
    if (typeof value === "string" && value.trim()) {
      return [value.trim()];
    }
    return [];
  };

  const patientName = profile.name || emergencyData.name || patientData?.name || "Patient Name";
  const patientId = profile.patient_id || patientData?.patient_id || emergencyData.patient_id || "N/A";
  const patientAge = profile.age ?? emergencyData.age ?? patientData?.age;
  const patientGender = profile.gender || emergencyData.gender || patientData?.gender || "Unknown";
  const contactNumber =
    firstNonEmpty(
      emergencyData.emergency_contact_phone,
      emergencyData.emergency_contact,
      profile.emergency_contact_phone,
      profile.emergency_contact,
      patientData?.emergency_contact_phone,
      patientData?.emergency_contact,
      emergencyData.phone,
      profile.phone,
      patientData?.phone
    ) || "Not available";

  const profilePhotoUrl = buildAbsoluteUrl(
    firstNonEmpty(
      profile.photo_url,
      profile.profile_photo,
      profile.avatar_url,
      profile.photo,
      emergencyData.photo_url,
      emergencyData.profile_photo,
      emergencyData.avatar_url,
      emergencyData.photo,
      patientData?.photo_url,
      patientData?.profile_photo,
      patientData?.avatar_url,
      patientData?.photo
    )
  );

  const knownAllergies = asList(summary.allergies?.length ? summary.allergies : (patientData?.allergies || emergencyData.allergies));
  const chronicDiseases = asList(summary.chronic_diseases?.length ? summary.chronic_diseases : emergencyData.chronic_conditions);
  const currentMedications = asList(
    summary.current_medications?.length ? summary.current_medications : (medicalHistory.medications || emergencyData.medications)
  );

  const leftMedications = currentMedications.slice(0, Math.ceil(currentMedications.length / 2));
  const rightMedications = currentMedications.slice(Math.ceil(currentMedications.length / 2));

  const surgeryEntries = Array.isArray(medicalHistory.surgeries) ? medicalHistory.surgeries : [];
  const lastSurgeryEntry = surgeryEntries.length ? surgeryEntries[surgeryEntries.length - 1] : null;
  const lastSurgeryName =
    summary.last_surgery && summary.last_surgery !== "N/A"
      ? summary.last_surgery
      : (typeof lastSurgeryEntry === "string"
          ? lastSurgeryEntry
          : (lastSurgeryEntry?.name || lastSurgeryEntry?.procedure || "None reported"));
  const lastSurgeryDate =
    typeof lastSurgeryEntry === "object" ? (lastSurgeryEntry?.date || lastSurgeryEntry?.surgery_date || "") : "";
  const lastSurgeryDoctor =
    typeof lastSurgeryEntry === "object" ? (lastSurgeryEntry?.doctor || lastSurgeryEntry?.surgeon || "") : "";

  const getAlertDescription = (alert) => {
    if (alert?.description) return alert.description;
    if (alert?.category === "allergy") return "Allergy risk identified. Avoid triggering medications/substances.";
    if (alert?.category === "chronic_condition") return "Chronic condition present. Monitor closely during emergency care.";
    if (alert?.category === "surgery_history") return "Surgical history noted. Consider this in immediate treatment planning.";
    if (alert?.category === "high_risk_condition") return "High-risk condition detected. Prioritize stabilizing protocol.";
    return "Clinical risk alert detected from patient emergency profile.";
  };

  return (
    <div className="emergency-consultation-page">
      {/* Top Header */}
      <header className="emergency-header">
        <div className="emergency-header-left">
          <div className="emergency-header-title">Health Passport</div>
          <div className="emergency-header-subtitle">AI Emergency Health</div>
        </div>
        <button onClick={onBack} className="emergency-dashboard-btn">Dashboard</button>
      </header>

      {/* Main Content */}
      <main className="emergency-main">
        <div className="emergency-content">
          {/* Main Heading */}
          <div className="emergency-heading-section">
            <h1 className="emergency-main-title">Emergency Consultation</h1>
            <p className="emergency-main-subtitle">
              Rapid access protocol initiated. Scan or enter patient credentials to begin immediate assessment.
            </p>
          </div>

          {/* QR Access Card */}
          {!patientData && (
            <div className="emergency-access-card">
              <EmergencyQRAccess onPatientLoaded={setPatientData} />
            </div>
          )}

          {/* Patient Data Display */}
          {patientData && (
            <div className="emergency-patient-display">
              {/* Patient Header Section */}
              <div className="emergency-patient-header">
                <div className="emergency-patient-photo-large">
                  {profilePhotoUrl && !photoLoadFailed ? (
                    <img
                      src={profilePhotoUrl}
                      alt={`${patientName} profile`}
                      className="emergency-patient-photo-image-large"
                      onError={() => setPhotoLoadFailed(true)}
                    />
                  ) : (
                    <div className="emergency-photo-placeholder-large">
                      {patientName ? patientName.charAt(0).toUpperCase() : "P"}
                    </div>
                  )}
                </div>
                <div className="emergency-patient-info-large">
                  <h1 className="emergency-patient-name-large">{patientName}</h1>
                  <div className="emergency-patient-details-row">
                    <span className="emergency-detail-item">ID: {patientId}</span>
                    <span className="emergency-detail-item">{patientAge ? `${patientAge} years` : "Age N/A"}</span>
                    <span className="emergency-detail-item">{patientGender}</span>
                  </div>
                  <div className="emergency-contact-large">
                    <span className="emergency-contact-label-large">Emergency Contact:</span>
                    <span className="emergency-contact-value-large">{contactNumber}</span>
                  </div>
                </div>
              </div>

              {/* Important Alerts Section */}
              <div className="emergency-alerts-section-new">
                <h3 className="emergency-alerts-title-new">
                  <span className="emergency-alerts-icon-new">⚠️</span>
                  IMPORTANT ALERTS
                </h3>
                <div className="emergency-alerts-grid">
                  {alerts.length > 0 ? (
                    alerts.slice(0, 4).map((alert, index) => (
                      <div
                        key={`${alert.label || "alert"}-${index}`}
                        className={`emergency-alert-card-new ${alert.severity === "critical" ? "emergency-alert-critical" : "emergency-alert-pacemaker"}`}
                      >
                        <h4 className="emergency-alert-title-new">{alert.label || "Clinical Alert"}</h4>
                        <p className="emergency-alert-description-new">{getAlertDescription(alert)}</p>
                      </div>
                    ))
                  ) : (
                    <div className="emergency-alert-card-new emergency-alert-pacemaker">
                      <h4 className="emergency-alert-title-new">No Critical Alerts</h4>
                      <p className="emergency-alert-description-new">
                        No major emergency alerts were returned by the backend profile.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section Divider */}
              <div className="emergency-section-divider">
                <h3 className="emergency-summary-title-new">EMERGENCY MEDICAL SUMMARY</h3>
                
              </div>

              {/* Summary Grid Layout (3 columns) */}
              <div className="emergency-summary-grid-new">
                {/* Blood Group Card */}
                <div className="emergency-summary-card-new">
                  <h4 className="emergency-card-title-new">Blood Group</h4>
                  <div className="emergency-blood-value">{summary.blood_group || "Not specified"}</div>
                </div>

                {/* Known Allergies Card */}
                <div className="emergency-summary-card-new">
                  <h4 className="emergency-card-title-new">Known Allergies</h4>
                  <ul className="emergency-allergy-list">
                    {knownAllergies.length > 0 ? (
                      knownAllergies.slice(0, 5).map((allergy, index) => (
                        <li key={index} className="emergency-allergy-item">{allergy}</li>
                      ))
                    ) : (
                      <li className="emergency-allergy-item emergency-no-data">None reported</li>
                    )}
                  </ul>
                </div>

                {/* Chronic Diseases Card */}
                <div className="emergency-summary-card-new">
                  <h4 className="emergency-card-title-new">Chronic Diseases</h4>
                  <ul className="emergency-disease-list">
                    {chronicDiseases.length > 0 ? (
                      chronicDiseases.slice(0, 5).map((disease, index) => (
                        <li key={index} className="emergency-disease-item">{disease}</li>
                      ))
                    ) : (
                      <li className="emergency-disease-item emergency-no-data">None reported</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Bottom Grid (2 columns) */}
              <div className="emergency-bottom-grid">
                {/* Current Medications Card */}
                <div className="emergency-medications-card-new">
                  <h4 className="emergency-card-title-new">Current Medications</h4>
                  <div className="emergency-medications-columns">
                    <div className="emergency-medication-column">
                      {leftMedications.length > 0 ? (
                        leftMedications.map((medication, index) => (
                          <div key={`left-med-${index}`} className="emergency-medication-item-new">{medication}</div>
                        ))
                      ) : (
                        <div className="emergency-medication-item-new emergency-no-data">None reported</div>
                      )}
                    </div>
                    <div className="emergency-medication-column">
                      {rightMedications.length > 0 ? (
                        rightMedications.map((medication, index) => (
                          <div key={`right-med-${index}`} className="emergency-medication-item-new">{medication}</div>
                        ))
                      ) : (
                        <div className="emergency-medication-item-new emergency-no-data">No additional medications</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Last Surgery Card */}
                <div className="emergency-surgery-card-new">
                  <h4 className="emergency-card-title-new">Last Surgery</h4>
                  <div className="emergency-surgery-details">
                    <div className="emergency-surgery-name-new">{lastSurgeryName}</div>
                    {lastSurgeryDate && (
                      <>
                        <div className="emergency-surgery-date-new">Date: {lastSurgeryDate}</div>
                        {lastSurgeryDoctor && <div className="emergency-surgery-doctor-new">Doctor: {lastSurgeryDoctor}</div>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
