import { useState } from "react";
import { loginAdmin } from "../services/api";

export default function Login({ onLogin, onGoSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

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
    <div className="hlogin-screen">
      <div className="hlogin-split-card">

        {/* ── Left: Dark teal panel with grid ── */}
        <div className="hlogin-left">
          <div className="hlogin-left-dots" />

          {/* Hospital building icon */}
          <div className="hlogin-left-icon">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="16" y="12" width="32" height="44" rx="4" fill="rgba(255,255,255,.15)" stroke="rgba(255,255,255,.5)" strokeWidth="2"/>
              <rect x="8" y="28" width="14" height="28" rx="3" fill="rgba(255,255,255,.10)" stroke="rgba(255,255,255,.4)" strokeWidth="1.5"/>
              <rect x="42" y="28" width="14" height="28" rx="3" fill="rgba(255,255,255,.10)" stroke="rgba(255,255,255,.4)" strokeWidth="1.5"/>
              <rect x="28" y="18" width="8" height="8" rx="1" fill="none" stroke="#fff" strokeWidth="2"/>
              <line x1="32" y1="19" x2="32" y2="25" stroke="#fff" strokeWidth="2"/>
              <line x1="29" y1="22" x2="35" y2="22" stroke="#fff" strokeWidth="2"/>
              <rect x="24" y="32" width="6" height="6" rx="1" fill="rgba(255,255,255,.3)"/>
              <rect x="34" y="32" width="6" height="6" rx="1" fill="rgba(255,255,255,.3)"/>
              <rect x="24" y="42" width="6" height="6" rx="1" fill="rgba(255,255,255,.3)"/>
              <rect x="34" y="42" width="6" height="6" rx="1" fill="rgba(255,255,255,.3)"/>
              <rect x="27" y="48" width="10" height="8" rx="2" fill="rgba(255,255,255,.25)" stroke="rgba(255,255,255,.5)" strokeWidth="1"/>
            </svg>
          </div>

          <h2 className="hlogin-left-title">AI Emergency<br/>Health Passport</h2>
          <p className="hlogin-left-desc">Hospital Administration Portal — manage doctors, patients &amp; compliance</p>

          <div className="hlogin-left-badges">
            <span className="hlogin-left-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              HIPAA Compliant
            </span>
            <span className="hlogin-left-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              AI Powered
            </span>
            <span className="hlogin-left-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Real-time
            </span>
          </div>
        </div>

        {/* ── Right: White form panel with concave curve ── */}
        <div className="hlogin-right">
          <div className="hlogin-right-accent" />

          <div className="hlogin-right-inner">
            <div className="hlogin-right-header">
              <h1 className="hlogin-right-title">Hospital Admin Login</h1>
              <p className="hlogin-right-sub">Sign in to the administration dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="hlogin-form">
              <div className="hlogin-field">
                <label className="hlogin-label">Email Address</label>
                <div className="hlogin-input-wrap">
                  <span className="hlogin-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@hospital.org"
                    className="hlogin-input"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="hlogin-field">
                <label className="hlogin-label">Password</label>
                <div className="hlogin-input-wrap">
                  <span className="hlogin-input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                  </span>
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="hlogin-input"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="hlogin-eye"
                    onClick={() => setShowPass(!showPass)}
                    tabIndex={-1}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="hlogin-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                  {error}
                </div>
              )}

              <button type="submit" className="hlogin-btn" disabled={loading}>
                {loading ? <span className="hlogin-spinner" /> : "Sign In"}
              </button>
            </form>

            <div className="hlogin-footer">
              <span>Don't have an account?</span>
              <button onClick={onGoSignup} className="hlogin-footer-link">Create Account</button>
            </div>
          </div>
        </div>

      </div>
      <p className="hlogin-copy">&copy; {new Date().getFullYear()} AI Emergency Health Passport</p>
    </div>
  );
}
