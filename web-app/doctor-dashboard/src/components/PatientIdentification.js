import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { requestNormalAccess } from "../services/api";

/**
 * Step 1 — Patient Identification
 * Load patient by Patient ID or QR code.
 * Validates patient existence — no emergency auto-access.
 */
export default function PatientIdentification({ onPatientLoaded }) {
  const [mode, setMode] = useState("id"); // "id" | "qr"
  const [patientId, setPatientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef(null);
  const scannerDomId = "normal-consult-qr-reader";

  const parsePatientIdFromQr = (raw) => {
    const value = (raw || "").trim();
    if (!value) return "";

    const lower = value.toLowerCase();
    if (lower.startsWith("patient_id:")) {
      return value.split(":", 2)[1]?.trim() || "";
    }

    if (lower.startsWith("http") && value.includes("/")) {
      return value.replace(/\/+$/, "").split("/").pop()?.trim() || "";
    }

    return value;
  };

  const handleLoad = async (id) => {
    const pid = parsePatientIdFromQr(id || patientId);
    if (!pid) return;
    setLoading(true);
    setError("");
    try {
      const data = await requestNormalAccess(pid);
      if (typeof onPatientLoaded === "function") onPatientLoaded(data);
    } catch (err) {
      setError(err.message || "Patient not found");
    } finally {
      setLoading(false);
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.stop();
    } catch (_) {
      // Ignore stop errors when scanner is already closed.
    }
    scannerRef.current = null;
    setScanning(false);
  };

  const startScanner = async () => {
    setError("");
    if (scannerRef.current) {
      await stopScanner();
    }

    try {
      const scanner = new Html5Qrcode(scannerDomId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          const pid = parsePatientIdFromQr(decodedText);
          if (!pid) return;
          setPatientId(pid);
          await stopScanner();
          handleLoad(pid);
        }
      );

      setScanning(true);
    } catch (err) {
      setError(err?.message || "Unable to access camera for QR scanning.");
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="step-card">
      <h3 className="step-heading"><span className="step-number">1</span> Patient Identification</h3>

      {/* Mode selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button
          type="button"
          onClick={async () => {
            setMode("id");
            await stopScanner();
          }}
          className={`chip ${mode === "id" ? "chip-active" : "chip-default"}`}>
          🪪 Patient ID
        </button>
        <button
          type="button"
          onClick={async () => {
            setMode("qr");
            await startScanner();
          }}
          className={`chip ${mode === "qr" ? "chip-active" : "chip-default"}`}>
          📷 QR Code
        </button>
      </div>

      {/* Patient ID input */}
      {mode === "id" && (
        <div style={{ display: "flex", gap: 8 }}>
          <input
            placeholder="Enter Patient ID (e.g. HP-1234-5678)"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLoad()}
            className="form-input"
            style={{ flex: 1 }}
          />
          <button onClick={() => handleLoad()} disabled={loading} className="btn btn-primary">
            {loading ? "Loading…" : "Load Patient"}
          </button>
        </div>
      )}

      {mode === "qr" && (
        <div>
          <div
            id={scannerDomId}
            style={{
              width: "100%",
              minHeight: 240,
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #d9dee6",
              background: "#f6f8fc",
            }}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {!scanning ? (
              <button type="button" onClick={startScanner} className="btn btn-primary">
                Start Camera Scan
              </button>
            ) : (
              <button type="button" onClick={stopScanner} className="btn btn-secondary">
                Stop Scanner
              </button>
            )}

            <button
              type="button"
              onClick={() => handleLoad(patientId)}
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Loading…" : "Load Scanned Patient"}
            </button>
          </div>

          <input
            placeholder="Or paste QR value / Patient ID manually"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="form-input"
            style={{ width: "100%", marginTop: 10 }}
          />
        </div>
      )}

      <p className="form-hint" style={{ marginTop: 8 }}>
        ⚠️ QR only identifies patient. Consent is still mandatory before consultation access.
      </p>

      {error && <div className="alert alert-error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
