const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function pad(value: string | number) {
  return String(value).padStart(2, '0')
}

function getPart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
  fallback: string
) {
  return parts.find((part) => part.type === type)?.value ?? fallback
}

function parseDateKey(dateKey: string) {
  const [yearValue, monthValue, dayValue] = dateKey.split('-').map((part) => Number(part))

  if (!yearValue || !monthValue || !dayValue) {
    return null
  }

  return {
    year: yearValue,
    month: monthValue,
    day: dayValue,
  }
}

function getUlaanbaatarDateTimeParts(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ulaanbaatar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)

  return {
    year: getPart(parts, 'year', '1970'),
    month: getPart(parts, 'month', '01'),
    day: getPart(parts, 'day', '01'),
    hour: getPart(parts, 'hour', '00'),
    minute: getPart(parts, 'minute', '00'),
  }
}

export function buildDateRange(startDateKey: string, totalDays: number) {
  const start = parseDateKey(startDateKey)

  if (!start || totalDays <= 0) {
    return []
  }

  const cursor = new Date(Date.UTC(start.year, start.month - 1, start.day))
  const results: string[] = []

  for (let index = 0; index < totalDays; index += 1) {
    const value = new Date(cursor)
    value.setUTCDate(cursor.getUTCDate() + index)

    results.push(
      `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`
    )
  }

  return results
}

export function formatCalendarDayLabel(dateKey: string) {
  const parsed = parseDateKey(dateKey)

  if (!parsed) {
    return dateKey
  }

  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day))
  const weekday = WEEKDAY_NAMES[date.getUTCDay()] ?? ''
  const month = MONTH_NAMES[parsed.month - 1] ?? pad(parsed.month)

  return `${weekday}, ${month} ${parsed.day}`
}

export function formatDateInUlaanbaatar(value: string) {
  const parts = getUlaanbaatarDateTimeParts(value)

  if (!parts) {
    return value
  }

  return `${parts.year}-${parts.month}-${parts.day}`
}

export function formatDateTimeInUlaanbaatar(value: string) {
  const parts = getUlaanbaatarDateTimeParts(value)

  if (!parts) {
    return value
  }

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`
}
