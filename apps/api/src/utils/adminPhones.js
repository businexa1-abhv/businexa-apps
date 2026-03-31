/**
 * Optional env: ADMIN_MOBILE_NUMBERS=comma-separated 10-digit Indian mobiles (e.g. 9876543210,9123456789).
 * Those numbers receive role `admin` on first signup (new user only). Existing users keep DB role.
 */
function normalizeIndianMobile(s) {
  if (s == null) return '';
  const t = String(s).trim().replace(/\s/g, '');
  if (/^[6-9]\d{9}$/.test(t)) return t;
  if (/^\+91[6-9]\d{9}$/.test(t)) return t.slice(3);
  if (/^91[6-9]\d{9}$/.test(t)) return t.slice(2);
  return '';
}

/** @returns {Set<string>} */
function loadAdminMobileSet() {
  const raw = process.env.ADMIN_MOBILE_NUMBERS || '';
  const set = new Set();
  raw.split(/[,;\s]+/).forEach((part) => {
    const m = normalizeIndianMobile(part);
    if (m) set.add(m);
  });
  return set;
}

let cachedSet = null;
function getAdminMobileSet() {
  if (!cachedSet) cachedSet = loadAdminMobileSet();
  return cachedSet;
}

/** Call when env may have changed (tests). */
function resetAdminMobileCache() {
  cachedSet = null;
}

function isListedAdminPhone(mobileNumber) {
  if (!mobileNumber) return false;
  const m = normalizeIndianMobile(mobileNumber);
  if (!m) return false;
  return getAdminMobileSet().has(m);
}

module.exports = {
  normalizeIndianMobile,
  isListedAdminPhone,
  resetAdminMobileCache,
};
