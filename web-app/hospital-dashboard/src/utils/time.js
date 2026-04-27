function normalizeUtcInput(value) {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const hasTimezone = /(Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  return hasTimezone ? raw : `${raw}Z`;
}

export function parseUtcToLocalDate(value) {
  const normalized = normalizeUtcInput(value);
  if (!normalized) return null;
  const dt = new Date(normalized);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export function formatLocalDateTime(value, options = {}) {
  const dt = parseUtcToLocalDate(value);
  if (!dt) return "—";
  return dt.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  });
}

export function formatLocalDate(value, options = {}) {
  const dt = parseUtcToLocalDate(value);
  if (!dt) return "—";
  return dt.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    ...options,
  });
}

export function formatLocalTime(value, options = {}) {
  const dt = parseUtcToLocalDate(value);
  if (!dt) return "—";
  return dt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  });
}
