import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { scanEmergencyQR } from "../services/api";

export default function ScanQR({ onBack }) {
  const [scanning, setScanning] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [patientData, setPatientData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const containerRef = useRef(null);

  // Start camera QR scanner
  const startScanner = async () => {
    setError("");
    setPatientData(null);

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // QR decoded – stop scanner and process token
          scanner.stop().catch(() => {});
          scannerRef.current = null;
          setScanning(false);
          handleToken(decodedText);
        },
        () => {} // ignore scan failures (no QR in frame)
      );

      setScanning(true);
    } catch (err) {
      setError("Could not access camera. Use manual token entry instead.");
    }
  };

  // Stop camera scanner
  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Process scanned/entered token
  const handleToken = async (token) => {
    const trimmed = token.trim();
    if (!trimmed) {
      setError("Token is empty");
      return;
    }

    setLoading(true);
    setError("");
    setPatientData(null);

    try {
      const result = await scanEmergencyQR(trimmed);
      setPatientData(result);
    } catch (err) {
      setError(err.message || "Invalid or expired token");
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    stopScanner();
    handleToken(manualToken);
  };

  const resetScan = () => {
    setPatientData(null);
    setError("");
    setManualToken("");
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: 620, margin: "0 auto" }}>
      <h2 className="page-title" style={{ textAlign: "center" }}>🔍 Scan Emergency QR Code</h2>
      <p className="page-subtitle" style={{ textAlign: "center", marginBottom: 24 }}>
        Scan a patient's emergency QR code or enter the token manually to access
        their critical medical data.
      </p>

      {/* Camera Scanner Section */}
      {!patientData && (
        <div className="step-card qr-section">
          <h3 className="step-heading"><span className="step-number">📷</span> Camera Scanner</h3>
          <div
            id="qr-reader"
            ref={containerRef}
            style={{ width: "100%", minHeight: scanning ? 300 : 0, marginBottom: 12, borderRadius: "var(--radius)", overflow: "hidden" }}
          />
          {!scanning ? (
            <button onClick={startScanner} className="btn btn-primary btn-lg" style={{ width: "100%" }}>
              Start Camera Scanner
            </button>
          ) : (
            <button onClick={stopScanner} className="btn btn-danger btn-lg" style={{ width: "100%" }}>
              Stop Scanner
            </button>
          )}
        </div>
      )}

      {/* Manual Token Entry */}
      {!patientData && (
        <div className="step-card">
          <h3 className="step-heading"><span className="step-number">⌨️</span> Manual Token Entry</h3>
          <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              className="form-input"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Paste emergency token here..."
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="loading-bar"><div className="spinner" /><span>Verifying emergency token...</span></div>
      )}

      {/* Error */}
      {error && <div className="alert alert-error">❌ {error}</div>}

      {/* Patient Emergency Data */}
      {patientData && (
        <div>
          <div className="success-banner">✅ Token verified — Emergency access granted</div>

          <div className="passport-card">
            <h3 style={{ margin: "0 0 16px", color: "var(--emergency)" }}>🏥 Emergency Patient Data</h3>

            <PatientField label="Patient ID" value={patientData.patient_id} />

            {patientData.emergency_data && (
              <>
                <PatientField label="Name" value={patientData.emergency_data.name || "N/A"} />
                <PatientField label="Blood Group" value={patientData.emergency_data.blood_group || "N/A"} valueClass="text-danger fw-700" valueStyle={{ fontSize: 18 }} />
                <PatientField label="Allergies" value={renderListOrString(patientData.emergency_data.allergies)} valueClass="text-warning" />
                <PatientField label="Chronic Conditions" value={renderListOrString(patientData.emergency_data.chronic_conditions)} />
              </>
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={resetScan} className="btn btn-primary btn-lg" style={{ width: "100%" }}>
              Scan Another QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PatientField({ label, value, valueClass = "", valueStyle = {} }) {
  return (
    <div className="flex-between" style={{ padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
      <span className="form-label" style={{ marginBottom: 0 }}>{label}</span>
      <span className={valueClass} style={{ textAlign: "right", maxWidth: "60%", ...valueStyle }}>{value}</span>
    </div>
  );
}

function renderListOrString(val) {
  if (!val) return "None";
  if (Array.isArray(val)) return val.length > 0 ? val.join(", ") : "None";
  return String(val) || "None";
}
