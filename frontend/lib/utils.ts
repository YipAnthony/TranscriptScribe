import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string as a locale date string (MM/DD/YYYY or local format).
 * Returns 'N/A' if input is null/undefined/empty.
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

/**
 * Formats a date string as a locale date+time string.
 * Returns 'N/A' if input is null/undefined/empty.
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString()
}

/**
 * Unescapes common LaTeX/HTML entities in a string.
 */
export function unescapeText(text: string): string {
  if (!text) return text;
  return text
    .replace(/\\>/g, '>')
    .replace(/\\</g, '<')
    .replace(/\\&/g, '&')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
}

/**
 * Truncates text to a max length, appending '...' if truncated.
 */
export function truncateText(text: string, maxLength: number = 100): string {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

/**
 * Returns label and color class for a given status.
 * Use in conjunction with your Badge component.
 * @param status - The status string (e.g. 'RECRUITING', 'COMPLETED', etc.)
 * @param type - 'trial' (default) or 'appointment' for different status sets
 */
export function getStatusBadgeInfo(
  status: string,
  type: 'trial' | 'appointment' = 'trial'
): { label: string; color: string } {
  if (type === 'trial') {
    const statusConfig: Record<string, { label: string; color: string }> = {
      RECRUITING: { label: 'Recruiting', color: 'bg-green-100 text-green-800' },
      ACTIVE_NOT_RECRUITING: { label: 'Active', color: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { label: 'Completed', color: 'bg-blue-100 text-blue-800' },
      TERMINATED: { label: 'Terminated', color: 'bg-red-100 text-red-800' },
      SUSPENDED: { label: 'Suspended', color: 'bg-orange-100 text-orange-800' },
      WITHDRAWN: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' },
    }
    return statusConfig[status] || { label: status, color: 'bg-gray-100 text-gray-800' }
  } else {
    const statusConfig: Record<string, { label: string; color: string }> = {
      PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      PROCESSING: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
      COMPLETED: { label: 'Completed', color: 'bg-green-100 text-green-800' },
      FAILED: { label: 'Failed', color: 'bg-red-100 text-red-800' },
    }
    return statusConfig[status] || statusConfig.PENDING
  }
}
