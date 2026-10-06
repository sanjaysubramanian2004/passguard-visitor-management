/**
 * Formats a 24-hour time string (e.g. "14:30", "09:05", "14:30:00") or ISO string
 * into 12-hour AM/PM format (e.g. "2:30 PM", "9:05 AM", "12:00 PM").
 */
export function formatTime12h(timeStr?: string | null): string {
  if (!timeStr) return '--:--';

  const str = String(timeStr).trim();
  if (!str) return '--:--';

  // If already contains AM/PM
  if (/am|pm/i.test(str)) {
    return str;
  }

  // If ISO date string (contains T or space date)
  if (str.includes('T') || (str.includes('-') && str.includes(':'))) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
  }

  // Expect HH:MM or HH:MM:SS format
  const parts = str.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].padStart(2, '0');

    if (isNaN(hours)) return str;

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;

    return `${hours}:${minutes} ${ampm}`;
  }

  return str;
}

/**
 * Formats a time range with 12-hour AM/PM format
 * e.g. "09:00" and "17:00" -> "9:00 AM - 5:00 PM"
 */
export function formatTimeRange12h(startTime?: string | null, endTime?: string | null): string {
  if (!startTime && !endTime) return '--';
  if (startTime && !endTime) return formatTime12h(startTime);
  if (!startTime && endTime) return formatTime12h(endTime);
  return `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`;
}

/**
 * Formats a date string (YYYY-MM-DD) into a human readable date
 * e.g. "2026-10-06" -> "Oct 6, 2026"
 */
export function formatDateReadable(dateStr?: string | null): string {
  if (!dateStr) return '--';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }
  }
  return dateStr;
}
