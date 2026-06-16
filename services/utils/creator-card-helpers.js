const crypto = require('crypto');

const ALLOWED_SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789-_-';
const ALLOWED_ACCESS_CODE_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
const MAX_SLUG_LENGTH = 50;
const MIN_SLUG_LENGTH = 5;
const SUFFIX_LENGTH = 6;

function isAllowedSlugCharacter(char) {
  return ALLOWED_SLUG_CHARS.includes(char);
}

function isAllowedAccessCodeCharacter(char) {
  return ALLOWED_ACCESS_CODE_CHARS.includes(char.toLowerCase());
}

function sanitizeSlugInput(title) {
  if (typeof title !== 'string') {
    return '';
  }

  let sanitized = '';
  const lowercased = title.toLowerCase();

  for (let i = 0; i < lowercased.length; i++) {
    const char = lowercased[i];
    if (char === ' ') {
      sanitized = `${sanitized}-`;
    } else if (isAllowedSlugCharacter(char)) {
      sanitized = `${sanitized}${char}`;
    }
  }

  return sanitized;
}

function isValidSlug(slug) {
  if (typeof slug !== 'string') {
    return false;
  }

  if (slug.length < MIN_SLUG_LENGTH || slug.length > MAX_SLUG_LENGTH) {
    return false;
  }

  for (let i = 0; i < slug.length; i++) {
    if (!isAllowedSlugCharacter(slug[i])) {
      return false;
    }
  }

  return true;
}

function generateRandomSuffix(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  const bytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    suffix = `${suffix}${chars[bytes[i] % chars.length]}`;
  }

  return suffix;
}

async function generateUniqueSlug(title, isSlugTaken) {
  const baseSlug = sanitizeSlugInput(title).slice(0, MAX_SLUG_LENGTH);

  if (baseSlug.length >= MIN_SLUG_LENGTH && !(await isSlugTaken(baseSlug))) {
    return baseSlug;
  }

  const base = baseSlug.slice(0, MAX_SLUG_LENGTH - SUFFIX_LENGTH - 1) || 'card';
  const maxRetries = 10;

  for (let i = 0; i < maxRetries; i++) {
    const candidate = `${base}-${generateRandomSuffix(SUFFIX_LENGTH)}`;
    // Sequential checks are intentional: stop as soon as a free slug is found.
    // eslint-disable-next-line no-await-in-loop
    if (!(await isSlugTaken(candidate))) {
      return candidate;
    }
  }

  throw new Error('Unable to generate a unique slug after multiple attempts');
}

function isValidUrl(url) {
  return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
}

function isPositiveInteger(value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

function isValidAccessCode(accessCode) {
  if (typeof accessCode !== 'string' || accessCode.length !== 6) {
    return false;
  }

  for (let i = 0; i < accessCode.length; i++) {
    if (!isAllowedAccessCodeCharacter(accessCode[i])) {
      return false;
    }
  }

  return true;
}

module.exports = {
  sanitizeSlugInput,
  isValidSlug,
  generateUniqueSlug,
  isValidUrl,
  isPositiveInteger,
  isValidAccessCode,
};
