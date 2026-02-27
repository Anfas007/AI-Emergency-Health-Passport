import { useState, useEffect } from "react";
import { fetchDepartments, createDepartment, updateDepartment, deleteDepartment } from "../services/api";

export default function Departments({ onBack }) {
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name: "", head_doctor_id: "", description: "" });
  const [editingName, setEditingName] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchDepartments();
      setDepts(data.departments || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!form.name.trim()) { setError("Department name is required"); return; }
    try {
      if (editingName) {
        await updateDepartment(editingName, form);
        setSuccess(`Department "${form.name}" updated`);
      } else {
        await createDepartment(form);
        setSuccess(`Department "${form.name}" created`);
      }
      setForm({ name: "", head_doctor_id: "", description: "" });
      setEditingName(null);
      load();
    } catch (e) { setError(e.message); }
  };

  const handleEdit = (d) => {
    setEditingName(d.name);
    setForm({ name: d.name, head_doctor_id: d.head_doctor_id || "", description: d.description || "" });
  };

  const handleDelete = async (name) => {
    if (!window.confirm(`Delete department "${name}"?`)) return;
    try {
      await deleteDepartment(name);
      setSuccess(`Deleted "${name}"`);
      load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="page-title">Department Management</h2>
      <p className="page-subtitle">Create, update & organize hospital departments</p>

      {/* Form */}
      <div className="form-card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "var(--text-primary)" }}>
          {editingName ? `✏️ Edit: ${editingName}` : "➕ Create New Department"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Department Name *</label>
              <input placeholder="e.g. Cardiology" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Head Doctor ID</label>
              <input placeholder="DOC-XXXXXXXX (optional)" value={form.head_doctor_id}
                onChange={e => setForm(f => ({ ...f, head_doctor_id: e.target.value }))} className="form-input" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea placeholder="Brief description of the department" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2} className="form-input" />
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="submit" className="btn btn-primary">{editingName ? "Update Department" : "Create Department"}</button>
            {editingName && (
              <button type="button" className="btn btn-outline"
                onClick={() => { setEditingName(null); setForm({ name: "", head_doctor_id: "", description: "" }); }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      {/* List */}
      {loading ? (
        <p className="text-muted loading-pulse" style={{ padding: 20 }}>Loading departments...</p>
      ) : depts.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏢</div>
          <p>No departments yet. Create your first department above.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Head Doctor</th>
                <th>Description</th>
                <th style={{ width: 100 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {depts.map(d => (
                <tr key={d.department_id}>
                  <td style={{ fontWeight: 600 }}>{d.name}</td>
                  <td>
                    {d.head_doctor_id
                      ? <span className="badge badge-info">{d.head_doctor_id}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: 13 }}>{d.description || "—"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => handleEdit(d)} className="btn btn-ghost btn-sm">✏️</button>
                      <button onClick={() => handleDelete(d.name)} className="btn btn-sm" style={{ background: "var(--danger-light)", color: "var(--danger)" }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
