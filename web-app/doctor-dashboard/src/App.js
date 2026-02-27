import { useState, useEffect } from "react";
import Login from "./pages/Login";
import DoctorHome from "./pages/DoctorHome";
import EmergencyConsultation from "./pages/EmergencyConsultation";
import NormalConsultation from "./pages/NormalConsultation";
import ManageRecords from "./pages/ManageRecords";
import EmergencyLogs from "./pages/EmergencyLogs";
import DoctorProfile from "./pages/DoctorProfile";
import HospitalSelector from "./components/HospitalSelector";
import { getToken, clearToken, fetchCurrentDoctor, getActiveHospital, getSavedHospitals, selectHospital } from "./services/api";

function App() {
  const [doctor, setDoctor] = useState(null);   // logged-in doctor object
  const [hospitals, setHospitals] = useState([]); // doctor's hospital affiliations
  const [activeHospital, setActiveHospital] = useState(""); // selected hospital_code
  const [activeHospitalName, setActiveHospitalName] = useState("");
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);  // checking saved session

  // On mount, check if a valid JWT exists in sessionStorage
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetchCurrentDoctor()
      .then((doc) => {
        setDoctor(doc);
        // Restore hospital context from sessionStorage / profile
        const savedHosp = getActiveHospital();
        const savedList = getSavedHospitals();
        if (savedHosp) {
          setActiveHospital(savedHosp);
          const match = savedList.find(h => h.hospital_code === savedHosp);
          setActiveHospitalName(match?.hospital_name || doc.active_hospital_name || savedHosp);
        } else if (doc.active_hospital_code) {
          setActiveHospital(doc.active_hospital_code);
          setActiveHospitalName(doc.active_hospital_name || doc.active_hospital_code);
        }
        if (savedList.length > 0) {
          setHospitals(savedList);
        }
      })
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const goHome = () => setMode(null);

  const handleLogin = (data) => {
    // data = { access_token, doctor: {...}, hospitals: [...], active_hospital }
    setDoctor(data.doctor);
    setHospitals(data.hospitals || []);
    if (data.active_hospital) {
      setActiveHospital(data.active_hospital);
      const match = (data.hospitals || []).find(h => h.hospital_code === data.active_hospital);
      setActiveHospitalName(match?.hospital_name || data.active_hospital);
    } else {
      setActiveHospital("");
      setActiveHospitalName("");
    }
    setMode(null);
  };

  const handleHospitalSelect = (hospitalCode, hospitalName, result) => {
    setActiveHospital(hospitalCode);
    setActiveHospitalName(hospitalName || hospitalCode);
  };

  const handleSwitchHospital = () => {
    // Clear active hospital to show selector again
    setActiveHospital("");
    setActiveHospitalName("");
    sessionStorage.removeItem("active_hospital");
    setMode(null);
  };

  const handleLogout = () => {
    clearToken();
    sessionStorage.removeItem("hospitals");
    sessionStorage.removeItem("active_hospital");
    setDoctor(null);
    setHospitals([]);
    setActiveHospital("");
    setActiveHospitalName("");
    setMode(null);
  };

  // Show nothing while verifying saved session
  if (loading) {
    return (
      <div className="flex-center" style={{ height: "100vh", background: "var(--bg)" }}>
        <div className="text-center">
          <div className="spinner" style={{ width: 36, height: 36, margin: "0 auto 16px" }}></div>
          <p style={{ fontSize: 15, color: "var(--text-muted)", fontWeight: 600 }}>Verifying session...</p>
        </div>
      </div>
    );
  }

  // ── Auth gate ──
  if (!doctor) {
    return (
      <Login
        onLogin={handleLogin}
        onGoSignup={() => window.open("http://localhost:3002","_blank")}
      />
    );
  }

  // ── Hospital selection gate (only when multiple hospitals) ──
  if (hospitals.length > 1 && !activeHospital) {
    return (
      <HospitalSelector
        hospitals={hospitals}
        doctorName={doctor.name}
        onSelect={handleHospitalSelect}
      />
    );
  }

  // ── Page titles ──
  const PAGE_TITLES = {
    emergency: "Emergency Consultation",
    normal: "Normal Consultation",
    records: "Manage Records",
    logs: "Emergency Logs",
    profile: "Doctor Profile",
  };

  // ── Render active page ──
  const renderPage = () => {
    if (!mode) {
      return (
        <DoctorHome
          onSelect={setMode}
          doctorName={doctor.name}
          hospitalName={activeHospitalName}
          hospitalCode={activeHospital}
          multiHospital={hospitals.length > 1}
          onSwitchHospital={handleSwitchHospital}
        />
      );
    }
    if (mode === "emergency") return <EmergencyConsultation onBack={goHome} />;
    if (mode === "normal") return <NormalConsultation onBack={goHome} />;
    if (mode === "records") return <ManageRecords onBack={goHome} />;
    if (mode === "logs") return <EmergencyLogs onBack={goHome} />;
    if (mode === "profile") return <DoctorProfile onBack={goHome} onLogout={handleLogout} doctor={doctor} activeHospital={activeHospitalName} />;
    return null;
  };

  return (
    <div>
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="top-nav-brand">
          <div className="top-nav-brand-icon">🏥</div>
          <div>
            <div className="top-nav-title">
              {mode ? PAGE_TITLES[mode] || "Dashboard" : "Doctor Dashboard"}
            </div>
            <div className="top-nav-subtitle">AI Emergency Health Passport</div>
          </div>
        </div>

        <div className="top-nav-actions">
          {activeHospitalName && (
            <div className="hospital-badge">
              <span>🏨</span>
              <span>{activeHospitalName}</span>
              {hospitals.length > 1 && (
                <button onClick={handleSwitchHospital} className="btn btn-sm btn-primary" style={{ marginLeft: 6, padding: "3px 10px", fontSize: 11 }}>
                  Switch
                </button>
              )}
            </div>
          )}
          {mode && (
            <button onClick={goHome} className="btn btn-outline btn-sm">
              ← Dashboard
            </button>
          )}
          <button
            onClick={() => setMode("profile")}
            className="avatar avatar-sm"
            style={{ cursor: "pointer", border: "none" }}
            title="Profile"
          >
            {(doctor.name || "D").replace("Dr. ", "").charAt(0)}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content animate-fade-in" key={mode || "home"}>
        {renderPage()}
      </div>
    </div>
  );
}

export default App;
