/**
 * Utility functions for handling dates with proper timezone support
 */

/**
 * Converts a Date object to a local date string in YYYY-MM-DD format
 * This ensures the date stays in the user's local timezone instead of converting to UTC
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Converts a Date object to a local timestamp string in ISO format
 * This ensures the timestamp stays in the user's local timezone
 */
export function toLocalTimestampString(date: Date): string {
  return date.toISOString()
}

/**
 * Converts a date string (YYYY-MM-DD) to a Date object in local timezone
 * This prevents timezone conversion issues when parsing dates
 */
export function fromLocalDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Gets today's date in local timezone as YYYY-MM-DD string
 */
export function getTodayLocalDateString(): string {
  return toLocalDateString(new Date())
}

/**
 * Formats a date for display in the user's locale
 * This handles the timezone conversion properly for display
 */
export function formatDateForDisplay(dateString: string): string {
  const date = fromLocalDateString(dateString)
  return date.toLocaleDateString()
}

/**
 * Checks if a date string represents today in local timezone
 */
export function isToday(dateString: string): boolean {
  return dateString === getTodayLocalDateString()
}

/**
 * Gets the start and end of a day in local timezone
 */
export function getDayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

/**
 * Formats a timestamp for display in the user's locale
 * Shows both date and time in a readable format
 */
export function formatTimestampForDisplay(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Formats a timestamp for display with just the time
 */
export function formatTimeForDisplay(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

/**
 * Formats a timestamp for display with just the date
 */
export function formatTimestampDateForDisplay(timestamp: string): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
