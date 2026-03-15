import { useState, useEffect } from "react";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import HospitalHome from "./pages/HospitalHome";
import DoctorManagement from "./pages/DoctorManagement";
import PatientManagement from "./pages/PatientManagement";
import AuditCompliance from "./pages/AuditCompliance";
import AdminProfile from "./pages/AdminProfile";
import Sidebar from "./components/Sidebar";
import TopHeader from "./components/TopHeader";
import { getToken, clearToken, fetchProfile } from "./services/api";

const PAGE_TITLES = {
  null: "Dashboard Overview",
  doctors: "Hospital Management",
  patients: "Patient Management",
  "audit-compliance": "Audit Logs & Compliance",
  profile: "Hospital Profile",
};

function App() {
  const [admin, setAdmin] = useState(null);
  const [authPage, setAuthPage] = useState("login");
  const [mode, setMode] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, verify existing session
  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    fetchProfile()
      .then(setAdmin)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  const goHome = () => setMode(null);

  const handleLogin = (data) => {
    setAdmin(data.admin || data);
    setMode(null);
  };

  const handleSignupSuccess = () => {
    alert("Hospital admin account created! Please login.");
    setAuthPage("login");
  };

  const handleLogout = () => {
    clearToken();
    setAdmin(null);
    setMode(null);
    setAuthPage("login");
  };

  if (loading) {
    return (
      <div className="auth-page">
        <div style={{ textAlign: "center" }}>
          <div className="auth-logo loading-pulse">🏥</div>
          <p style={{ color: "#94A3B8", fontSize: 15, marginTop: 16 }}>Verifying session...</p>
        </div>
      </div>
    );
  }

  // ── Auth gate ──
  if (!admin) {
    if (authPage === "signup") {
      return <Signup onSignupSuccess={handleSignupSuccess} onGoLogin={() => setAuthPage("login")} />;
    }
    return <Login onLogin={handleLogin} onGoSignup={() => setAuthPage("signup")} />;
  }

  const adminName = admin.admin_name || admin.hospital_name || "Admin";
  const hospitalName = admin.hospital_name || "";

  // ── Authenticated layout with sidebar ──
  const renderPage = () => {
    if (!mode) return <HospitalHome onSelect={setMode} adminName={adminName} />;
    if (mode === "doctors") return <DoctorManagement onBack={goHome} />;
    if (mode === "patients") return <PatientManagement onBack={goHome} />;
    if (mode === "audit-compliance") return <AuditCompliance onBack={goHome} />;
    if (mode === "profile") return <AdminProfile onBack={goHome} onLogout={handleLogout} />;
    return null;
  };

  return (
    <div className="app-layout">
      <Sidebar
        activeMode={mode}
        onSelect={setMode}
        hospitalName={hospitalName}
      />
      <main className="main-content">
        <TopHeader
          title={PAGE_TITLES[mode] || "Dashboard"}
          adminName={adminName}
          onProfileClick={() => setMode("profile")}
        />
        <div className="page-content animate-fade-in" key={mode}>
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
