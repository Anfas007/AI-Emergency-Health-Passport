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
    <div className="emergency-access-container">
      {/* Card Title */}
      <div className="emergency-access-header">
        <h2 className="emergency-access-title">Emergency QR Access</h2>
        <p className="emergency-access-description">
          Position patient QR code within frame or input manually.
        </p>
      </div>

      {/* QR Scan Area */}
      <div className={`emergency-qr-area ${scanning ? 'scanning' : ''}`}>
        <div id="ec-qr-reader" className="emergency-qr-reader" />
        {!scanning && (
          <div className="emergency-qr-placeholder">
            <div className="emergency-qr-icon">📱</div>
            <button onClick={startScanner} className="emergency-camera-btn">
              Start Camera
            </button>
          </div>
        )}
        {scanning && (
          <button onClick={stopScanner} className="emergency-stop-btn">
            Stop Camera
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="emergency-divider">
        <div className="emergency-divider-line"></div>
        <span className="emergency-divider-text">OR MANUAL ENTRY</span>
        <div className="emergency-divider-line"></div>
      </div>

      {/* Manual Input */}
      <div className="emergency-manual-input">
        <form onSubmit={e => { e.preventDefault(); stopScanner(); handleToken(manualToken); }} className="emergency-input-form">
          <input
            value={manualToken}
            onChange={e => setManualToken(e.target.value)}
            placeholder="Paste QR value / patient ID..."
            className="emergency-input-field"
          />
          <button type="submit" disabled={loading} className="emergency-verify-btn">
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && <div className="emergency-error">{error}</div>}
    </div>
  );
}

