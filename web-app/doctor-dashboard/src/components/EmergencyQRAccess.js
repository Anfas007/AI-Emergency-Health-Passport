import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { scanEmergencyQR } from "../services/api";

/**
 * Inline Emergency QR scanner (camera + manual token).
 * On success calls onPatientLoaded({ patient_id, emergency_data }).
 */
export default function EmergencyQRAccess({ onPatientLoaded }) {
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef(null);

  /* ── camera scanner ── */
  const startScanner = async () => {
    setError("");
    try {
      const scanner = new Html5Qrcode("ec-qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => {
          scanner.stop().catch(() => {});
          scannerRef.current = null;
          setScanning(false);
          handleToken(decoded);
        },
        () => {}
      );
      setScanning(true);
    } catch {
      setError("Camera unavailable — use manual token entry.");
    }
  };

  const stopScanner = () => {
    scannerRef.current?.stop().catch(() => {});
    scannerRef.current = null;
    setScanning(false);
  };

  useEffect(() => () => scannerRef.current?.stop().catch(() => {}), []);

  /* ── verify token ── */
  const handleToken = async (token) => {
    const t = token.trim();
    if (!t) { setError("Token is empty"); return; }
    setLoading(true); setError("");
    try {
      const res = await scanEmergencyQR(t);
      onPatientLoaded(res);
    } catch (e) {
      setError(e.message || "Invalid or expired token");
    } finally { setLoading(false); }
  };

  return (
    <div className="step-card qr-section">
      <h3 className="step-heading"><span className="step-number">🔐</span> Step 1 — Emergency QR Access</h3>
      <p className="text-secondary" style={{ fontSize: 13, margin: "0 0 12px" }}>
        Scan the patient's emergency QR code or paste a token to unlock their critical data.
      </p>

      <div id="ec-qr-reader" style={{ width: "100%", minHeight: scanning ? 260 : 0, borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 10 }} />

      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        {!scanning
          ? <button onClick={startScanner} className="btn btn-primary">📷 Start Camera</button>
          : <button onClick={stopScanner} className="btn btn-danger">⏹ Stop Camera</button>
        }
      </div>

      <form onSubmit={e => { e.preventDefault(); stopScanner(); handleToken(manualToken); }} style={{ display: "flex", gap: 8 }}>
        <input value={manualToken} onChange={e => setManualToken(e.target.value)} placeholder="Paste emergency token…" className="form-input" style={{ flex: 1 }} />
        <button type="submit" disabled={loading} className="btn btn-success">{loading ? "Verifying…" : "Verify"}</button>
      </form>

      {loading && <div className="loading-bar" style={{ marginTop: 10 }}><div className="spinner" /><span>Verifying…</span></div>}
      {error && <div className="alert alert-error" style={{ marginTop: 10 }}>❌ {error}</div>}
    </div>
  );
}

