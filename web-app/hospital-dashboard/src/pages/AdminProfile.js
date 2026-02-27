import { useState, useEffect } from "react";
import { fetchProfile } from "../services/api";

export default function AdminProfile({ onBack, onLogout }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProfile()
      .then(setProfile)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in" style={{ maxWidth: 600 }}>
      <h2 className="page-title">Hospital Profile</h2>
      <p className="page-subtitle">Manage your account and hospital settings</p>

      {loading && <p className="text-muted loading-pulse">Loading profile...</p>}
      {error && <div className="alert alert-error">⚠️ {error}</div>}

      {profile && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div className="avatar" style={{ margin: "0 auto 12px" }}>
              {(profile.admin_name || "A")[0].toUpperCase()}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>
              {profile.admin_name || "—"}
            </div>
            <span className="badge badge-primary" style={{ marginTop: 6 }}>
              {profile.role || "hospital_admin"}
            </span>
          </div>

          <div style={{ borderTop: "1px solid var(--border-light)" }}>
            <ProfileRow label="Email" value={profile.email} />
            <ProfileRow label="Hospital" value={profile.hospital_name} />
            <ProfileRow label="Hospital Code" value={profile.hospital_code} />
            <ProfileRow label="Role" value={profile.role || "hospital_admin"} highlight />
            {profile.created_at && (
              <ProfileRow label="Member Since" value={new Date(profile.created_at).toLocaleDateString()} />
            )}
          </div>
        </div>
      )}

      <button onClick={onLogout} className="btn btn-danger w-full" style={{ padding: "14px 0", fontSize: 15, borderRadius: "var(--radius)" }}>
        🚪 Sign Out
      </button>
    </div>
  );
}

function ProfileRow({ label, value, highlight }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "14px 0", borderBottom: "1px solid var(--border-light)"
    }}>
      <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 14 }}>{label}</span>
      <span style={{
        color: highlight ? "var(--primary)" : "var(--text-primary)",
        fontSize: 14, fontWeight: highlight ? 700 : 500
      }}>{value || "—"}</span>
    </div>
  );
}
