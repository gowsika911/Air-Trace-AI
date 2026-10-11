// Pure helpers for zone data (kept separate from server.js so they are easy to test).

// The 12 data fields: 5 air quality + 3 weather + 4 context (station, location, date, time).
const NUMERIC_RANGES = {
  pm25: [0, 1000],
  pm10: [0, 2000],
  no2: [0, 1000],
  so2: [0, 1000],
  co: [0, 100],
  temperature: [-50, 60],
  humidity: [0, 100],
  windSpeed: [0, 300],
};

function isValidDate(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function isValidTime(str) {
  return typeof str === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(str);
}

/**
 * Validates an admin edit. Returns { error } or { fields } (numbers converted).
 * Only fields present in the body are checked, so partial updates still work.
 */
function validateZoneUpdate(body = {}) {
  const fields = {};

  for (const [key, [min, max]] of Object.entries(NUMERIC_RANGES)) {
    const value = body[key];
    if (value === undefined) continue;
    const num = Number(value);
    if (value === '' || value === null || typeof value === 'boolean' || Number.isNaN(num) || num < min || num > max) {
      return { error: `${key} must be a number between ${min} and ${max}.` };
    }
    fields[key] = num;
  }

  for (const key of ['station', 'location']) {
    if (body[key] === undefined) continue;
    const text = String(body[key]).trim();
    if (!text) return { error: `${key} cannot be empty.` };
    if (text.length > 100) return { error: `${key} is too long (max 100 characters).` };
    fields[key] = text;
  }

  if (body.date !== undefined) {
    if (!isValidDate(body.date)) return { error: 'date must be a valid date (YYYY-MM-DD).' };
    fields.date = body.date;
  }
  if (body.time !== undefined) {
    if (!isValidTime(body.time)) return { error: 'time must be a valid 24-hour time (HH:MM).' };
    fields.time = body.time;
  }

  return { fields };
}

/** Current date (YYYY-MM-DD) and time (HH:MM) in India Standard Time. */
function nowInIST(now = new Date()) {
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  const time = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).format(now);
  return { date, time };
}

/** Context fields for a zone: the admin-set reading date/time, or live IST time if none was set. */
function buildZoneContext(zone, now = new Date()) {
  const live = nowInIST(now);
  const date = isValidDate(zone.date) ? zone.date : live.date;
  const time = isValidTime(zone.time) ? zone.time : live.time;
  const [year, month, day] = date.split('-').map(Number);
  const monthName = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'long' })
    .format(new Date(Date.UTC(year, month - 1, day)));

  return { station: zone.station, location: zone.location, date, time, month: monthName, year };
}

module.exports = { validateZoneUpdate, buildZoneContext, nowInIST, isValidDate, isValidTime };
