import { useState } from "react";

export default function DoctorProfile({ onBack, onLogout, doctor, activeHospital }) {
  const [duty, setDuty] = useState("on-duty");

  const toggleDuty = () =>
    setDuty((prev) => (prev === "on-duty" ? "off-duty" : "on-duty"));

  const isOnDuty = duty === "on-duty";

  const initial = doctor?.name ? doctor.name.replace("Dr. ", "").charAt(0) : "D";

  return (
    <div className="animate-fade-in" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="step-card">
        {/* Avatar */}
        <div className="flex-between" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className="avatar avatar-lg">{initial}</div>
            <div>
              <h2 className="page-title" style={{ marginBottom: 2 }}>{doctor?.name || "Doctor"}</h2>
              <span className="text-secondary">Doctor / Emergency Physician</span>
            </div>
          </div>
        </div>

        <hr className="divider" />

        {/* Info Fields */}
        <ProfileRow label="Doctor ID" value={doctor?.doctor_id || "—"} />
        <ProfileRow label="Specialization" value={doctor?.specialization || "—"} />
        <ProfileRow label="Email" value={doctor?.email || "—"} />
        <ProfileRow label="Phone" value={doctor?.phone || "—"} />
        <ProfileRow label="Role-Based Access" value="Emergency Access Authorized" valueClass="text-primary fw-600" />
        <ProfileRow label="Active Hospital" value={activeHospital || "None selected"} valueClass="text-success fw-600" />

        <hr className="divider" />

        {/* Availability Toggle */}
        <div className="flex-between" style={{ padding: "10px 0" }}>
          <span className="form-label">Availability</span>
          <button onClick={toggleDuty} className={`duty-btn ${isOnDuty ? "duty-on" : "duty-off"}`}>
            {isOnDuty ? "🟢 On-Duty" : "🔴 Off-Duty"}
          </button>
        </div>

        {isOnDuty && (
          <p className="form-hint text-success" style={{ textAlign: "center" }}>
            You are currently available to receive emergency consultations.
          </p>
        )}
        {!isOnDuty && (
          <p className="form-hint" style={{ textAlign: "center", color: "var(--emergency)" }}>
            You are marked off-duty. Emergency cases will not be routed to you.
          </p>
        )}

        <hr className="divider" />

        {/* Logout */}
        <button onClick={onLogout} className="btn btn-danger btn-lg" style={{ width: "100%" }}>
          🚪 Logout
        </button>
      </div>
    </div>
  );
}

function ProfileRow({ label, value, valueClass = "" }) {
  return (
    <div className="flex-between" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span className="form-label" style={{ marginBottom: 0 }}>{label}</span>
      <span className={valueClass} style={{ fontSize: 14 }}>{value}</span>
    </div>
  );
}
