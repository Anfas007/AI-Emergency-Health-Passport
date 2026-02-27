import { useState } from "react";
import { loginDoctor } from "../services/api";

export default function Login({ onLogin, onGoSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const result = await loginDoctor({ email, password });
      onLogin(result);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🏥</div>
          <h1 className="auth-title">AI Emergency Health Passport</h1>
          <p className="auth-subtitle">Doctor Dashboard — Login</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@hospital.org"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="form-input"
            />
          </div>

          {error && <div className="alert alert-error">❌ {error}</div>}

          <button type="submit" className="btn btn-primary btn-lg w-full" style={{ marginTop: 8 }} disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-footer">
          <span>Don't have an account? </span>
          <button onClick={onGoSignup} className="auth-link">
            Register via Hospital
          </button>
        </div>
      </div>
    </div>
  );
}
