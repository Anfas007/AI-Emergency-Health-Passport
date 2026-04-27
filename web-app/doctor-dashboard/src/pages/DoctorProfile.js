import { useState } from "react";

export default function DoctorProfile({ onBack, onLogout, doctor, activeHospital }) {
  const [duty, setDuty] = useState("on-duty");

  const toggleDuty = () =>
    setDuty((prev) => (prev === "on-duty" ? "off-duty" : "on-duty"));

  const isOnDuty = duty === "on-duty";

  const initial = doctor?.name ? doctor.name.replace("Dr. ", "").charAt(0) : "D";

  return (
    <div className="profile-page">
      {/* Top Header */}
      <header className="emergency-header">
        <div className="emergency-header-left">
          <div className="emergency-header-title">Health Passport</div>
          <div className="emergency-header-subtitle">AI Emergency Health</div>
        </div>
        <button onClick={onBack} className="emergency-dashboard-btn">Dashboard</button>
      </header>

      {/* Main Content */}
      <main className="profile-main">
        <div className="profile-content">
          {/* Main Heading */}
          <div className="profile-heading-section">
            <h1 className="profile-main-title">Doctor Profile</h1>
            <p className="profile-main-subtitle">
              Manage your professional information, availability status, and account settings.
            </p>
          </div>

          {/* Profile Card */}
          <div className="profile-card">
            {/* Avatar Section */}
            <div className="profile-avatar-section">
              <div className="profile-avatar">
                <div className="profile-avatar-initial">{initial}</div>
              </div>
              <div className="profile-info">
                <h2 className="profile-name">{doctor?.name || "Doctor"}</h2>
                <p className="profile-role">Doctor / Emergency Physician</p>
              </div>
            </div>

            <div className="profile-divider"></div>

            {/* Profile Details */}
            <div className="profile-details">
              <ProfileRow label="Doctor ID" value={doctor?.doctor_id || "—"} />
              <ProfileRow label="Specialization" value={doctor?.specialization || "—"} />
              <ProfileRow label="Email" value={doctor?.email || "—"} />
              <ProfileRow label="Phone" value={doctor?.phone || "—"} />
              <ProfileRow
                label="Role-Based Access"
                value="Emergency Access Authorized"
                valueClass="profile-access-authorized"
              />
              <ProfileRow
                label="Active Hospital"
                value={activeHospital || "None selected"}
                valueClass="profile-hospital-active"
              />
            </div>

            <div className="profile-divider"></div>

            {/* Availability Toggle */}
            <div className="profile-availability">
              <div className="profile-availability-row">
                <span className="profile-availability-label">Availability Status</span>
                <button onClick={toggleDuty} className={`profile-duty-btn ${isOnDuty ? "duty-on" : "duty-off"}`}>
                  {isOnDuty ? "🟢 On-Duty" : "🔴 Off-Duty"}
                </button>
              </div>

              {isOnDuty && (
                <p className="profile-status-message profile-status-on">
                  You are currently available to receive emergency consultations.
                </p>
              )}
              {!isOnDuty && (
                <p className="profile-status-message profile-status-off">
                  You are marked off-duty. Emergency cases will not be routed to you.
                </p>
              )}
            </div>

            <div className="profile-divider"></div>

            {/* Logout Button */}
            <button onClick={onLogout} className="profile-logout-btn">
              🚪 Logout
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProfileRow({ label, value, valueClass = "" }) {
  return (
    <div className="profile-row">
      <span className="profile-row-label">{label}</span>
      <span className={`profile-row-value ${valueClass}`}>{value}</span>
    </div>
  );
}
