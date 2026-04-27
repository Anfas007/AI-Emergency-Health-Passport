import { useState, useEffect } from "react";
import { fetchDoctors, registerDoctor, assignDoctor, revokeDoctor } from "../services/api";

export default function DoctorManagement({ onBack }) {
  const [data, setData] = useState({ hospital_doctors: [], legacy_doctors: [], unaffiliated_doctors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("directory"); // directory | register
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", specialization: "General Medicine", phone: "", role: "doctor", department: "" });
  const [assignForm, setAssignForm] = useState({ doctor_id: "", role: "doctor", department: "" });
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Deactivate confirmation
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState("");

  const load = async () => {
    setLoading(true);
    try { const d = await fetchDoctors(); setData(d); } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleRegister = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      const r = await registerDoctor(regForm);
      setSuccess(`Doctor ${r.name} registered (${r.doctor_id}) — Association created`);
      setRegForm({ name: "", email: "", password: "", specialization: "General Medicine", phone: "", role: "doctor", department: "" });
      load();
    } catch (e) { setError(e.message); }
  };

  const handleAssign = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      const r = await assignDoctor(assignForm);
      setSuccess(r.message || "Doctor assigned successfully");
      setAssignForm({ doctor_id: "", role: "doctor", department: "" });
      setShowAssignModal(false);
      load();
    } catch (e) { setError(e.message); }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;
    setError(""); setSuccess("");
    try {
      const r = await revokeDoctor({ doctor_id: deactivateTarget.doctor_id, reason: deactivateReason });
      setSuccess(r.message || `Doctor ${deactivateTarget.name} deactivated successfully`);
      setDeactivateTarget(null);
      setDeactivateReason("");
      load();
    } catch (e) { setError(e.message); }
  };

  const quickAssign = (doc) => {
    setAssignForm(f => ({ ...f, doctor_id: doc.doctor_id }));
    setShowAssignModal(true);
  };

  // Determine status for each doctor
  const getStatus = (doc) => {
    if (doc.association_status === "active") {
      return { label: "Active", cls: "badge-success" };
    }
    if (doc.association_status === "revoked" || doc.association_status === "transferred") {
      return { label: "Inactive", cls: "badge-danger" };
    }
    if (!doc.verified) {
      return { label: "Pending", cls: "badge-warning" };
    }
    return { label: "Active", cls: "badge-success" };
  };

  return (
    <div className="animate-fade-in">
      <h2 className="page-title">Doctor Management</h2>
      <p className="page-subtitle">Register & manage doctors at your hospital</p>

      {/* Simplified Tabs — only 2 */}
      <div className="tab-bar">
        <button onClick={() => setTab("directory")}
          className={`tab-btn${tab === "directory" ? " active" : ""}`}>
          📋 Doctor Directory
        </button>
        <button onClick={() => setTab("register")}
          className={`tab-btn${tab === "register" ? " active" : ""}`}>
          ➕ Register New Doctor
        </button>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      {/* Deactivate Confirmation Modal */}
      {deactivateTarget && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: 440, width: "90%", padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--danger)", marginBottom: 8 }}>
              ⚠️ Deactivate Doctor
            </h3>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
              You are about to deactivate <strong>{deactivateTarget.name}</strong> ({deactivateTarget.doctor_id}).
              This is a soft delete — the record will be preserved for audit but the doctor will lose access.
            </p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                Reason (optional)
              </label>
              <textarea
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                className="form-input"
                style={{ minHeight: 60, width: "100%" }}
                placeholder="e.g. Resigned, transferred, policy violation..."
              />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => { setDeactivateTarget(null); setDeactivateReason(""); }}
                className="btn btn-secondary">Cancel</button>
              <button onClick={handleDeactivate} className="btn btn-danger">
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div className="card" style={{ maxWidth: 440, width: "90%", padding: 28 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--primary)", marginBottom: 16 }}>
              🔗 Assign Doctor to Hospital
            </h3>
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label className="form-label">Doctor ID</label>
                <input value={assignForm.doctor_id} readOnly className="form-input" style={{ background: "var(--border-light)" }} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select value={assignForm.role} onChange={e => setAssignForm(f => ({ ...f, role: e.target.value }))} className="form-select">
                    <option value="doctor">Doctor</option><option value="specialist">Specialist</option>
                    <option value="emergency_doctor">Emergency Doctor</option><option value="hod">Head of Department</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input value={assignForm.department} onChange={e => setAssignForm(f => ({ ...f, department: e.target.value }))} className="form-input" placeholder="e.g. Cardiology" />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button type="button" onClick={() => setShowAssignModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Assign Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab: Doctor Directory */}
      {tab === "directory" && (
        <>
          {/* Hospital Doctors */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              Hospital Doctors ({data.hospital_doctors.length})
            </h3>
          </div>
          {loading ? (
            <p className="text-muted loading-pulse">Loading doctors...</p>
          ) : data.hospital_doctors.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👨‍⚕️</div>
              <p>No doctors registered yet.</p>
            </div>
          ) : (
            <div className="table-container" style={{ marginBottom: 24 }}>
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Specialization</th><th>Dept</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {data.hospital_doctors.map(d => {
                    const status = getStatus(d);
                    return (
                      <tr key={d.doctor_id}>
                        <td><span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{d.doctor_id}</span></td>
                        <td style={{ fontWeight: 600 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: "var(--radius-full)",
                              background: status.label === "Active"
                                ? "linear-gradient(135deg, var(--primary), var(--teal))"
                                : status.label === "Inactive"
                                ? "linear-gradient(135deg, #94A3B8, #CBD5E1)"
                                : "linear-gradient(135deg, var(--warning), #FBBF24)",
                              color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 13, fontWeight: 700, flexShrink: 0
                            }}>{(d.name || "D")[0]}</div>
                            {d.name}
                          </div>
                        </td>
                        <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{d.email}</td>
                        <td>{d.specialization || <span className="text-muted">—</span>}</td>
                        <td>{d.association_department || d.department || <span className="text-muted">—</span>}</td>
                        <td><span className="badge badge-info">{d.association_role || "doctor"}</span></td>
                        <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                        <td>
                          <div style={{ display: "flex", gap: 6 }}>
                            {status.label !== "Inactive" && (
                              <button onClick={() => setDeactivateTarget(d)} className="btn btn-danger btn-sm">
                                Deactivate
                              </button>
                            )}
                            {status.label === "Inactive" && (
                              <span style={{ fontSize: 11, color: "var(--text-muted)", fontStyle: "italic" }}>Deactivated</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Legacy Doctors */}
          {(data.legacy_doctors || []).length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "var(--text-secondary)" }}>
                Legacy Doctors — No Association ({data.legacy_doctors.length})
              </h3>
              <p className="text-sm text-muted" style={{ marginBottom: 12 }}>
                These doctors have a hospital_code but no formal association record.
              </p>
              <div className="table-container" style={{ marginBottom: 24 }}>
                <table>
                  <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
                  <tbody>
                    {data.legacy_doctors.map(d => (
                      <tr key={d.doctor_id}>
                        <td style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{d.doctor_id}</td>
                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{d.email}</td>
                        <td><button onClick={() => quickAssign(d)} className="btn btn-primary btn-sm">Assign</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Unaffiliated Doctors */}
          {data.unaffiliated_doctors.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: "var(--text-secondary)" }}>
                Unaffiliated Doctors ({data.unaffiliated_doctors.length})
              </h3>
              <div className="table-container">
                <table>
                  <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Specialization</th><th>Actions</th></tr></thead>
                  <tbody>
                    {data.unaffiliated_doctors.map(d => (
                      <tr key={d.doctor_id}>
                        <td style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{d.doctor_id}</td>
                        <td style={{ fontWeight: 600 }}>{d.name}</td>
                        <td style={{ color: "var(--text-secondary)" }}>{d.email}</td>
                        <td>{d.specialization || "—"}</td>
                        <td><button onClick={() => quickAssign(d)} className="btn btn-primary btn-sm">Assign</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* Tab: Register New Doctor */}
      {tab === "register" && (
        <div className="form-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Register New Doctor</h3>
          <form onSubmit={handleRegister}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input value={regForm.name} onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))} className="form-input" placeholder="Dr. Jane Smith" />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input type="email" value={regForm.email} onChange={e => setRegForm(f => ({ ...f, email: e.target.value }))} className="form-input" placeholder="jane@hospital.org" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} className="form-input" placeholder="Min 6 characters" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input value={regForm.phone} onChange={e => setRegForm(f => ({ ...f, phone: e.target.value }))} className="form-input" placeholder="+91 98765 43210" />
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <select value={regForm.specialization} onChange={e => setRegForm(f => ({ ...f, specialization: e.target.value }))} className="form-select">
                  <option>General Medicine</option><option>Emergency Medicine</option><option>Cardiology</option>
                  <option>Neurology</option><option>Orthopedics</option><option>Pediatrics</option>
                  <option>Surgery</option><option>Anesthesiology</option><option>Radiology</option><option>Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select value={regForm.role} onChange={e => setRegForm(f => ({ ...f, role: e.target.value }))} className="form-select">
                  <option value="doctor">Doctor</option><option value="specialist">Specialist</option>
                  <option value="emergency_doctor">Emergency Doctor</option><option value="hod">Head of Department</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Department</label>
              <input value={regForm.department} onChange={e => setRegForm(f => ({ ...f, department: e.target.value }))} className="form-input" placeholder="e.g. Cardiology" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>Register Doctor</button>
          </form>
        </div>
      )}
    </div>
  );
}
