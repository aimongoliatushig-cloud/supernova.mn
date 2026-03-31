export interface BookingDateOption {
  value: string
  weekday: string
  month: string
  day: string
  isoLabel: string
}

const MONGOLIA_TIME_ZONE = 'Asia/Ulaanbaatar'

function getDatePart(
  date: Date,
  type: 'year' | 'month' | 'day',
  timeZone: string
) {
  const part = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    [type]: type === 'year' ? 'numeric' : '2-digit',
  })
    .formatToParts(date)
    .find((entry) => entry.type === type)

  return Number(part?.value ?? 0)
}

function getZonedToday(timeZone: string) {
  const now = new Date()
  const year = getDatePart(now, 'year', timeZone)
  const month = getDatePart(now, 'month', timeZone)
  const day = getDatePart(now, 'day', timeZone)

  return new Date(Date.UTC(year, month - 1, day))
}

function formatDatePart(
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions
) {
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: 'UTC',
  }).format(date)
}

function toDateInputValue(date: Date) {
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getBookingDateOptions(
  timeZone: string = MONGOLIA_TIME_ZONE
): BookingDateOption[] {
  const options: BookingDateOption[] = []
  const zonedToday = getZonedToday(timeZone)

  for (let index = 1; index <= 14; index += 1) {
    const nextDate = new Date(zonedToday)
    nextDate.setUTCDate(zonedToday.getUTCDate() + index)

    if (nextDate.getUTCDay() === 0) {
      continue
    }

    options.push({
      value: toDateInputValue(nextDate),
      weekday: formatDatePart(nextDate, 'mn-MN', { weekday: 'short' }),
      month: formatDatePart(nextDate, 'mn-MN', { month: 'short' }),
      day: formatDatePart(nextDate, 'mn-MN', { day: 'numeric' }),
      isoLabel: formatDatePart(nextDate, 'mn-MN', {
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }),
    })
  }

  return options
}
