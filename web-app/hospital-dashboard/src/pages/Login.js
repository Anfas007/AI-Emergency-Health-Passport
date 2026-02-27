import { useState } from "react";
import { loginAdmin } from "../services/api";

export default function Login({ onLogin, onGoSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Please fill in all fields"); return; }
    setLoading(true);
    try {
      const result = await loginAdmin({ email, password });
      onLogin(result);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">🏥</div>
          <h1 className="auth-title">AI Emergency Health Passport</h1>
          <p className="auth-subtitle">Hospital Administration Portal</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@hospital.org" className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password" className="form-input" />
          </div>
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="auth-footer">
          <span>Don't have an account? </span>
          <button onClick={onGoSignup} className="auth-link">Create Account</button>
        </div>
      </div>
    </div>
  );
}
