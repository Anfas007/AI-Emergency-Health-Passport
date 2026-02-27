import { useState, useEffect } from "react";
import { fetchDoctors, registerDoctor, verifyDoctor, assignDoctor, revokeDoctor, transferDoctor } from "../services/api";

export default function DoctorManagement({ onBack }) {
  const [data, setData] = useState({ hospital_doctors: [], legacy_doctors: [], unaffiliated_doctors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tab, setTab] = useState("list"); // list | register | verify | assign | revoke
  const [regForm, setRegForm] = useState({ name: "", email: "", password: "", specialization: "General Medicine", phone: "", role: "doctor", department: "" });
  const [verForm, setVerForm] = useState({ doctor_id: "", verified: true, specialization: "", department: "", role_level: "doctor" });
  const [assignForm, setAssignForm] = useState({ doctor_id: "", role: "doctor", department: "" });
  const [revokeForm, setRevokeForm] = useState({ doctor_id: "", reason: "", action: "revoke" }); // action: revoke | transfer

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

  const handleVerify = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      const r = await verifyDoctor(verForm);
      setSuccess(`Doctor ${r.doctor_id} — ${r.status}`);
      setVerForm(v => ({ ...v, doctor_id: "" }));
      load();
    } catch (e) { setError(e.message); }
  };

  const handleAssign = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      const r = await assignDoctor(assignForm);
      setSuccess(r.message || "Doctor assigned successfully");
      setAssignForm({ doctor_id: "", role: "doctor", department: "" });
      load();
    } catch (e) { setError(e.message); }
  };

  const handleRevoke = async (e) => {
    e.preventDefault(); setError(""); setSuccess("");
    try {
      let r;
      if (revokeForm.action === "transfer") {
        r = await transferDoctor({ doctor_id: revokeForm.doctor_id, reason: revokeForm.reason });
      } else {
        r = await revokeDoctor({ doctor_id: revokeForm.doctor_id, reason: revokeForm.reason });
      }
      setSuccess(r.message || `Doctor ${revokeForm.action}d successfully`);
      setRevokeForm({ doctor_id: "", reason: "", action: "revoke" });
      load();
    } catch (e) { setError(e.message); }
  };

  const quickVerify = (doc) => {
    setTab("verify");
    setVerForm(v => ({ ...v, doctor_id: doc.doctor_id, specialization: doc.specialization || "" }));
  };

  const quickAssign = (doc) => {
    setTab("assign");
    setAssignForm(f => ({ ...f, doctor_id: doc.doctor_id }));
  };

  const quickRevoke = (doc) => {
    setTab("revoke");
    setRevokeForm(f => ({ ...f, doctor_id: doc.doctor_id }));
  };

  return (
    <div className="animate-fade-in">
      <h2 className="page-title">Doctor Management</h2>
      <p className="page-subtitle">Register, verify & assign doctors to your hospital</p>

      {/* Tabs */}
      <div className="tab-bar">
        {["list", "register", "verify", "assign", "revoke"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`tab-btn${tab === t ? " active" : ""}`}>
            {t === "list" ? "📋 Doctor List" :
             t === "register" ? "➕ Register" :
             t === "verify" ? "✅ Verify" :
             t === "assign" ? "🔗 Assign" : "🚫 Revoke"}
          </button>
        ))}
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      {/* Tab: List */}
      {tab === "list" && (
        <>
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
                  {data.hospital_doctors.map(d => (
                    <tr key={d.doctor_id}>
                      <td><span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>{d.doctor_id}</span></td>
                      <td style={{ fontWeight: 600 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: "var(--radius-full)",
                            background: "linear-gradient(135deg, var(--primary), var(--teal))",
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
                      <td>{d.verified
                        ? <span className="badge badge-success">✓ Verified</span>
                        : <span className="badge badge-warning">⏳ Pending</span>}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {!d.verified && <button onClick={() => quickVerify(d)} className="btn btn-primary btn-sm">Verify</button>}
                          <button onClick={() => quickRevoke(d)} className="btn btn-danger btn-sm">Revoke</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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

      {/* Tab: Register */}
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

      {/* Tab: Verify */}
      {tab === "verify" && (
        <div className="form-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Verify & Assign Doctor</h3>
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label className="form-label">Doctor ID *</label>
              <input value={verForm.doctor_id} onChange={e => setVerForm(f => ({ ...f, doctor_id: e.target.value }))} className="form-input" placeholder="DOC-XXXXXXXX" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input value={verForm.specialization} onChange={e => setVerForm(f => ({ ...f, specialization: e.target.value }))} className="form-input" placeholder="e.g. Cardiologist" />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input value={verForm.department} onChange={e => setVerForm(f => ({ ...f, department: e.target.value }))} className="form-input" placeholder="e.g. Emergency" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Role Level</label>
              <select value={verForm.role_level} onChange={e => setVerForm(f => ({ ...f, role_level: e.target.value }))} className="form-select">
                <option value="doctor">Doctor</option><option value="senior_doctor">Senior Doctor</option><option value="hod">Head of Department</option>
              </select>
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={verForm.verified} onChange={e => setVerForm(f => ({ ...f, verified: e.target.checked }))} style={{ width: 18, height: 18, accentColor: "var(--primary)" }} />
              <label className="form-label" style={{ margin: 0 }}>Mark as Verified</label>
            </div>
            <button type="submit" className="btn btn-success" style={{ marginTop: 8 }}>Submit Verification</button>
          </form>
        </div>
      )}

      {/* Tab: Assign */}
      {tab === "assign" && (
        <div className="form-card">
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Assign Existing Doctor</h3>
          <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
            Affiliate a doctor from the system to this hospital (transferred or multi-hospital).
          </p>
          <form onSubmit={handleAssign}>
            <div className="form-group">
              <label className="form-label">Doctor ID *</label>
              <input value={assignForm.doctor_id} onChange={e => setAssignForm(f => ({ ...f, doctor_id: e.target.value }))} className="form-input" placeholder="DOC-XXXXXXXX" />
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
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>Assign Doctor</button>
          </form>
        </div>
      )}

      {/* Tab: Revoke / Transfer */}
      {tab === "revoke" && (
        <div className="form-card" style={{ borderColor: "var(--danger-border)", background: "var(--danger-light)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: "var(--danger)" }}>Revoke / Transfer Doctor</h3>
          <p className="text-sm text-muted" style={{ marginBottom: 16 }}>
            <strong>Revoke</strong> removes association. <strong>Transfer</strong> marks as transferred out.
          </p>
          <form onSubmit={handleRevoke}>
            <div className="form-group">
              <label className="form-label">Doctor ID *</label>
              <input value={revokeForm.doctor_id} onChange={e => setRevokeForm(f => ({ ...f, doctor_id: e.target.value }))} className="form-input" placeholder="DOC-XXXXXXXX" />
            </div>
            <div className="form-group">
              <label className="form-label">Action</label>
              <select value={revokeForm.action} onChange={e => setRevokeForm(f => ({ ...f, action: e.target.value }))} className="form-select">
                <option value="revoke">Revoke Access</option>
                <option value="transfer">Transfer Out</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea value={revokeForm.reason} onChange={e => setRevokeForm(f => ({ ...f, reason: e.target.value }))} className="form-input" style={{ minHeight: 60 }} placeholder="Optional reason..." />
            </div>
            <button type="submit" className="btn btn-danger" style={{ marginTop: 8 }}>
              {revokeForm.action === "transfer" ? "Transfer Doctor" : "Revoke Access"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
