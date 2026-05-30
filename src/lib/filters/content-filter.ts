/**
 * Content filter for Dottruck chat messages.
 * Detects and blocks phone numbers, emails, social media handles, and raw amounts.
 */

// Moroccan phone patterns
const PHONE_PATTERNS = [
  /0\s*[67]\s*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d/,
  /\+?\s*212\s*[67]\s*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d/,
  /00\s*212\s*[67]\s*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d[\s.-]*\d/,
]

// Text variants of phone prefixes (Moroccan Arabic/French)
const PHONE_TEXT_PATTERNS = [
  /zero\s*si[sx]/i,
  /zero\s*sept/i,
  /z[ée]ro\s*si[sx]/i,
  /z[ée]ro\s*sept/i,
  /sifr\s*sit+a/i,
  /sifr\s*sab[3a]/i,
  /صفر\s*ست[ةه]/,
  /صفر\s*سبع[ةه]/,
]

// Email pattern
const EMAIL_PATTERN = /\S+@\S+\.\S+/

// Social media keywords
const SOCIAL_KEYWORDS = [
  'whatsapp', 'whats app', 'watsap', 'watssap',
  'instagram', 'insta', 'ig',
  'facebook', 'fb',
  'telegram', 'tele', 'tg',
  'signal',
  'viber',
  'snapchat', 'snap',
  'واتساب', 'واتس', 'انستا', 'فيسبوك', 'تيليغرام',
]

// Amount patterns (to force use of price proposal component)
const AMOUNT_PATTERNS = [
  /\d{3,}\s*(dh|mad|درهم|dirham|dr)/i,
  /\d{3,}\s*(د[.]?ه|د[.]?م)/,
]

export type FilterResult = {
  blocked: boolean
  reason?: 'phone' | 'email' | 'social' | 'amount'
}

export function filterMessage(text: string): FilterResult {
  // Normalize: remove diacritics, collapse whitespace
  const normalized = text
    .replace(/[\u0610-\u061A\u064B-\u065F]/g, '') // Arabic diacritics
    .replace(/\s+/g, ' ')
    .trim()

  // Check phone numbers
  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(normalized)) {
      return { blocked: true, reason: 'phone' }
    }
  }

  // Check phone text variants
  for (const pattern of PHONE_TEXT_PATTERNS) {
    if (pattern.test(normalized)) {
      return { blocked: true, reason: 'phone' }
    }
  }

  // Check emails
  if (EMAIL_PATTERN.test(normalized)) {
    return { blocked: true, reason: 'email' }
  }

  // Check social media
  const lowerText = normalized.toLowerCase()
  for (const keyword of SOCIAL_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return { blocked: true, reason: 'social' }
    }
  }

  // Check amounts (force price proposal usage)
  for (const pattern of AMOUNT_PATTERNS) {
    if (pattern.test(normalized)) {
      return { blocked: true, reason: 'amount' }
    }
  }

  return { blocked: false }
}
