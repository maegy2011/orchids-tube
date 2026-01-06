export function getFormattedGregorianDate(language: string, date: Date = new Date()): string {
  let formatted = new Intl.DateTimeFormat(language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);

  // Add 'م' consistently for Arabic/Persian if not present
  if (language === 'ar' || language === 'fa') {
    formatted = formatted.replace(/\s*م$/g, '').trim() + ' م';
  }

  return formatted;
}

export function getDaysUntilRamadan(): number | null {
  const now = new Date();
  
  // Ramadan dates (approximate)
  // 1446 AH: March 1, 2025
  // 1447 AH: February 18, 2026
  const ramadanDates = [
    new Date("2025-03-01T00:00:00"),
    new Date("2026-02-18T00:00:00"),
    new Date("2027-02-08T00:00:00"),
  ];

  // Find the next Ramadan
  const nextRamadan = ramadanDates.find(date => date > now);
  
  if (!nextRamadan) return null;
  
  const diffTime = nextRamadan.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export function getFormattedHijriDate(language: string, offset: number = 0, date: Date = new Date()): string {
  const hijriDate = new Date(date);
  hijriDate.setDate(hijriDate.getDate() + offset);
  
  // Use 'islamic' calendar which is more widely supported than 'islamic-uma'
  // Force 'ar' locale for Islamic calendar to ensure Arabic month names if language is Arabic
  const locale = language.startsWith('ar') ? 'ar-SA-u-ca-islamic' : `${language}-u-ca-islamic`;
  
  let formatted = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(hijriDate);

    // Normalize: remove any existing 'ه' or 'هـ' and add 'هـ' consistently for Arabic/Persian
    if (language === 'ar' || language === 'fa') {
      // Remove any existing suffix like هـ, ه, AH, or H and trailing dots
      // Using a more robust regex for the Hijri suffix
      formatted = formatted.replace(/\s*(هـ|ه|AH|H)\.?\s*$/gi, '').trim();
      formatted = formatted + ' هـ';
    }

  return formatted;
}
