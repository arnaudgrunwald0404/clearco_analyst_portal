/**
 * Robust date parsing utility to handle various date formats
 */

export function parseDate(dateString: string | Date | number): Date | null {
  if (!dateString) return null

  // If already a Date object, return it
  if (dateString instanceof Date) {
    return isNaN(dateString.getTime()) ? null : dateString
  }

  // If it's a number, treat as timestamp
  if (typeof dateString === 'number') {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? null : date
  }

  // Convert to string and clean up
  const str = String(dateString).trim()
  if (!str) return null

  // Handle Excel serial date numbers (common in CSV exports from Excel)
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10)
    if (num > 25000 && num < 100000) { // Excel date range
      // Excel date serial number to JavaScript date
      const excelEpoch = new Date(1900, 0, 1)
      const date = new Date(excelEpoch.getTime() + (num - 2) * 24 * 60 * 60 * 1000)
      return isNaN(date.getTime()) ? null : date
    }
  }

  // Try various date formats
  const formats = [
    // ISO formats
    str,
    
    // Common US formats
    str.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$1-$2'), // MM/DD/YYYY -> YYYY-MM-DD
    str.replace(/(\d{1,2})\/(\d{1,2})\/(\d{2})/, '20$3-$1-$2'), // MM/DD/YY -> YYYY-MM-DD
    
    // Common European formats
    str.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, '$3-$2-$1'), // DD/MM/YYYY -> YYYY-MM-DD
    str.replace(/(\d{1,2})\.(\d{1,2})\.(\d{4})/, '$3-$2-$1'), // DD.MM.YYYY -> YYYY-MM-DD
    
    // Dash formats
    str.replace(/(\d{1,2})-(\d{1,2})-(\d{4})/, '$3-$1-$2'), // MM-DD-YYYY -> YYYY-MM-DD
    str.replace(/(\d{1,2})-(\d{1,2})-(\d{2})/, '20$3-$1-$2'), // MM-DD-YY -> YYYY-MM-DD
    
    // Handle formats with time
    str.split(' ')[0], // Take only date part if there's time
    str.split('T')[0], // Take only date part for ISO with time
  ]

  for (const format of formats) {
    try {
      const date = new Date(format)
      if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
        return date
      }
    } catch (e) {
      // Continue to next format
    }
  }

  // Try parsing with manual regex patterns for common formats
  const patterns = [
    // MM/DD/YYYY or M/D/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // DD/MM/YYYY or D/M/YYYY  
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    // MM-DD-YYYY
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    // DD.MM.YYYY
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,
  ]

  for (const pattern of patterns) {
    const match = str.match(pattern)
    if (match) {
      const [, p1, p2, p3] = match
      
      // Try different interpretations
      const attempts = [
        new Date(parseInt(p3), parseInt(p1) - 1, parseInt(p2)), // MM/DD/YYYY
        new Date(parseInt(p3), parseInt(p2) - 1, parseInt(p1)), // DD/MM/YYYY
        new Date(parseInt(p1), parseInt(p2) - 1, parseInt(p3)), // YYYY/MM/DD
      ]
      
      for (const attempt of attempts) {
        if (!isNaN(attempt.getTime()) && attempt.getFullYear() > 1900 && attempt.getFullYear() < 2100) {
          return attempt
        }
      }
    }
  }

  return null
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return '—'
  
  const d = typeof date === 'string' ? parseDate(date) : date
  if (!d) return '—'
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Validate that a date string can be parsed
 */
export function isValidDateString(dateString: string): boolean {
  return parseDate(dateString) !== null
}
