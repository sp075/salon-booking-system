function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidMobile(mobile) {
  if (!mobile || typeof mobile !== 'string') return false;
  const mobileRegex = /^\d{10}$/;
  return mobileRegex.test(mobile);
}

function isValidPassword(password) {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUppercase && hasLowercase && hasDigit && hasSpecial;
}

function isValidTime(time) {
  if (!time || typeof time !== 'string') return false;
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
  return timeRegex.test(time);
}

function isValidDate(date) {
  if (!date || typeof date !== 'string') return false;
  const dateRegex = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
  if (!dateRegex.test(date)) return false;
  const parsed = new Date(date + 'T00:00:00');
  return !isNaN(parsed.getTime());
}

function isValidUUID(id) {
  if (!id || typeof id !== 'string') return false;
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidV4Regex.test(id);
}

module.exports = {
  isValidEmail,
  isValidMobile,
  isValidPassword,
  isValidTime,
  isValidDate,
  isValidUUID,
};
