const API_BASE = "http://localhost:8000";

// ── Token helpers ──

export function saveToken(token) {
  sessionStorage.setItem("access_token", token);
}

export function getToken() {
  return sessionStorage.getItem("access_token");
}

export function clearToken() {
  sessionStorage.removeItem("access_token");
}

function authHeaders() {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// ── Auth ──

export async function loginDoctor(credentials) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Login failed");
  }
  const data = await response.json();
  if (data.access_token) saveToken(data.access_token);
  // Persist hospitals list and active hospital in sessionStorage
  if (data.hospitals) {
    sessionStorage.setItem("hospitals", JSON.stringify(data.hospitals));
  }
  if (data.active_hospital) {
    sessionStorage.setItem("active_hospital", data.active_hospital);
  }
  return data;
}

export async function signupDoctor(data) {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Signup failed");
  }
  return response.json();
}

export async function fetchCurrentDoctor() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    clearToken();
    throw new Error("Session expired");
  }
  return response.json();
}

// ── Hospital Selection ──

export async function selectHospital(hospitalCode) {
  const response = await fetch(`${API_BASE}/auth/select-hospital`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ hospital_code: hospitalCode }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to select hospital");
  }
  const data = await response.json();
  // Replace JWT with hospital-scoped one
  if (data.access_token) saveToken(data.access_token);
  if (data.active_hospital) {
    sessionStorage.setItem("active_hospital", data.active_hospital);
  }
  return data;
}

export async function fetchMyHospitals() {
  const response = await fetch(`${API_BASE}/auth/my-hospitals`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch hospitals");
  }
  return response.json();
}

export function getActiveHospital() {
  return sessionStorage.getItem("active_hospital") || "";
}

export function getSavedHospitals() {
  try {
    return JSON.parse(sessionStorage.getItem("hospitals") || "[]");
  } catch {
    return [];
  }
}

// ── Emergency ──

export async function postDoctorDecision(decisionData) {
  const response = await fetch(`${API_BASE}/emergency/doctor-decision`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(decisionData),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save decision");
  }
  return response.json();
}

export async function postDoctorNotes(notesData) {
  const response = await fetch(`${API_BASE}/emergency/doctor-notes`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(notesData),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save notes");
  }
  return response.json();
}

export async function requestNormalAccess(patientId) {
  const response = await fetch(`${API_BASE}/patients/request-access/${patientId}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Patient not found");
  }
  return response.json();
}

// ── Consent / Privacy ──
export async function fetchConsentStatus(patientId) {
  const response = await fetch(`${API_BASE}/patients/consent/${patientId}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch consent status");
  }
  return response.json();
}

export async function requestConsent(patientId) {
  const response = await fetch(`${API_BASE}/patients/request-consent/${patientId}`, {
    method: "POST",
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to request consent");
  }
  return response.json();
}

export async function fetchPatientHistory(patientId) {
  const response = await fetch(`${API_BASE}/patients/history/${patientId}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch history");
  }
  return response.json();
}

export async function updateMedicalRecords(patientId, recordData) {
  const response = await fetch(`${API_BASE}/patients/records/${patientId}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(recordData),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to update records");
  }
  return response.json();
}

export async function fetchEmergencyLogs() {
  const response = await fetch(`${API_BASE}/emergency/logs`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch logs");
  }
  return response.json();
}

export async function fetchPatientTimeline(patientId) {
  const response = await fetch(`${API_BASE}/emergency/timeline/${patientId}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch timeline");
  }
  return response.json();
}

export async function fetchEmergencyPatientView(patientId) {
  const response = await fetch(`${API_BASE}/emergency/patient-view/${patientId}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch patient view");
  }
  return response.json();
}

export async function scanEmergencyQR(token) {
  const response = await fetch(`${API_BASE}/emergency/scan/${token}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Invalid or expired emergency token");
  }
  return response.json();
}


// ── Normal Consultation ──

export async function saveConsultation(consultationData) {
  const response = await fetch(`${API_BASE}/patients/consultation`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(consultationData),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save consultation");
  }
  return response.json();
}

export async function fetchConsultationHistory(patientId) {
  const response = await fetch(`${API_BASE}/patients/consultations/${patientId}`, {
    headers: authHeaders(),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to fetch consultation history");
  }
  return response.json();
}

export async function notifyPatient(patientId, payload) {
  const response = await fetch(`${API_BASE}/patients/notify/${patientId}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to notify patient");
  }
  return response.json();
}
