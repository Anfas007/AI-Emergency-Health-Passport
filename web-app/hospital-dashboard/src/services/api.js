const API_BASE = "http://localhost:8000";

// ── Token helpers ──

export function saveToken(token) {
  sessionStorage.setItem("hospital_token", token);
}

export function getToken() {
  return sessionStorage.getItem("hospital_token");
}

export function clearToken() {
  sessionStorage.removeItem("hospital_token");
}

function authHeaders() {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function request(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

// ═══════ Auth ═══════

export async function loginAdmin(credentials) {
  const data = await request(`${API_BASE}/hospital/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  if (data.access_token) saveToken(data.access_token);
  return data;
}

export async function signupAdmin(payload) {
  return request(`${API_BASE}/hospital/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchProfile() {
  return request(`${API_BASE}/hospital/profile`, { headers: authHeaders() });
}

// ═══════ Departments ═══════

export async function fetchDepartments() {
  return request(`${API_BASE}/hospital/departments`, { headers: authHeaders() });
}

export async function createDepartment(dept) {
  return request(`${API_BASE}/hospital/departments`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(dept),
  });
}

export async function updateDepartment(oldName, dept) {
  return request(`${API_BASE}/hospital/departments/${encodeURIComponent(oldName)}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(dept),
  });
}

export async function deleteDepartment(name) {
  return request(`${API_BASE}/hospital/departments/${encodeURIComponent(name)}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
}

// ═══════ Doctors ═══════

export async function fetchDoctors() {
  return request(`${API_BASE}/hospital/doctors`, { headers: authHeaders() });
}

export async function fetchDoctorDetail(doctorId) {
  return request(`${API_BASE}/hospital/doctors/${doctorId}`, { headers: authHeaders() });
}

export async function registerDoctor(payload) {
  return request(`${API_BASE}/hospital/register-doctor`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function verifyDoctor(payload) {
  return request(`${API_BASE}/hospital/verify-doctor`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

// ═══════ Doctor–Hospital Associations ═══════

export async function assignDoctor(payload) {
  return request(`${API_BASE}/hospital/assign-doctor`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function revokeDoctor(payload) {
  return request(`${API_BASE}/hospital/revoke-doctor`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function transferDoctor(payload) {
  return request(`${API_BASE}/hospital/transfer-doctor`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function fetchDoctorAssociations(doctorId) {
  return request(`${API_BASE}/hospital/doctor-associations/${doctorId}`, { headers: authHeaders() });
}

// ═══════ Record Access ═══════

export async function fetchRecordAccess() {
  return request(`${API_BASE}/hospital/record-access`, { headers: authHeaders() });
}

// ═══════ Audit Logs ═══════

export async function fetchAuditLogs(params = {}) {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", params.limit);
  if (params.patient_id) qs.set("patient_id", params.patient_id);
  if (params.mode) qs.set("mode", params.mode);
  return request(`${API_BASE}/hospital/audit-logs?${qs}`, { headers: authHeaders() });
}

// ═══════ Compliance Report ═══════

export async function generateComplianceReport(filters = {}) {
  return request(`${API_BASE}/hospital/compliance-report`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(filters),
  });
}
