/**
 * Convert Arabic numerals to regular numerals
 * Arabic: ٠١٢٣٤٥٦٧٨٩
 * Regular: 0123456789
 */
function normalizePhoneNumber(phone) {
  if (!phone) return '';
  
  const arabicToRegular = {
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
  };
  
  // Convert Arabic numerals to regular numerals and remove spaces/dashes
  const normalized = phone
    .toString()
    .split('')
    .map(char => arabicToRegular[char] || char)
    .join('')
    .replace(/[\s-]/g, '');
  
  return normalized;
}

/**
 * Validate Egyptian phone number (supports both Arabic and regular numerals)
 */
function validateEgyptianPhone(phone) {
  if (!phone) return false;
  
  // Normalize Arabic numerals to regular numerals
  const cleaned = normalizePhoneNumber(phone);
  
  // Egyptian phone number patterns:
  // Mobile: 01X XXXX XXXX (11 digits starting with 01)
  // Landline: 02 XXXX XXXX (10 digits starting with 02)
  // With country code: +20 1X XXXX XXXX or +20 2X XXXX XXXX
  const mobilePattern = /^01[0-2,5]{1}[0-9]{8}$/;
  const landlinePattern = /^02[0-9]{8}$/;
  const countryCodeMobilePattern = /^\+201[0-2,5]{1}[0-9]{8}$/;
  const countryCodeLandlinePattern = /^\+202[0-9]{8}$/;
  
  return mobilePattern.test(cleaned) || 
         landlinePattern.test(cleaned) || 
         countryCodeMobilePattern.test(cleaned) || 
         countryCodeLandlinePattern.test(cleaned);
}

module.exports = {
  normalizePhoneNumber,
  validateEgyptianPhone
};
