import { useState } from "react";
import { signupAdmin } from "../services/api";

export default function Signup({ onSignupSuccess, onGoLogin }) {
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    hospital_name: "", hospital_code: "", phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.password || !form.hospital_name) {
      setError("Name, email, password, and hospital name are required"); return;
    }
    if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      await signupAdmin({
        name: form.name, email: form.email, password: form.password,
        hospital_name: form.hospital_name, hospital_code: form.hospital_code, phone: form.phone,
      });
      onSignupSuccess();
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in" style={{ maxHeight: "90vh", overflowY: "auto" }}>
        <div className="auth-header">
          <div className="auth-logo">🏥</div>
          <h1 className="auth-title">AI Emergency Health Passport</h1>
          <p className="auth-subtitle">Hospital Admin Registration</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input value={form.name} onChange={e => update("name", e.target.value)}
              placeholder="Admin Name" className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input type="email" value={form.email} onChange={e => update("email", e.target.value)}
              placeholder="admin@hospital.org" className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Hospital Name *</label>
            <input value={form.hospital_name} onChange={e => update("hospital_name", e.target.value)}
              placeholder="City General Hospital" className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Hospital Code (optional)</label>
            <input value={form.hospital_code} onChange={e => update("hospital_code", e.target.value)}
              placeholder="e.g. MGH-001" className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)}
              placeholder="+91 98765 43210" className="form-input" />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" value={form.password} onChange={e => update("password", e.target.value)}
                placeholder="Min 6 characters" className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input type="password" value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)}
                placeholder="Re-enter password" className="form-input" />
            </div>
          </div>
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Register Hospital"}
          </button>
        </form>
        <div className="auth-footer">
          <span>Already registered? </span>
          <button onClick={onGoLogin} className="auth-link">Sign In</button>
        </div>
      </div>
    </div>
  );
}
