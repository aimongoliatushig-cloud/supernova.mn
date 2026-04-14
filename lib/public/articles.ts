const ARTICLE_DATE_LOCALE = 'mn-MN'
const ARTICLE_DATE_TIME_ZONE = 'Asia/Ulaanbaatar'

function readArticleDate(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

export function formatArticleCardDate(value: string | null | undefined) {
  const date = readArticleDate(value)

  if (!date) {
    return ''
  }

  return new Intl.DateTimeFormat(ARTICLE_DATE_LOCALE, {
    month: 'short',
    day: 'numeric',
    timeZone: ARTICLE_DATE_TIME_ZONE,
  }).format(date)
}

export function formatArticleLongDate(value: string | null | undefined) {
  const date = readArticleDate(value)

  if (!date) {
    return ''
  }

  return new Intl.DateTimeFormat(ARTICLE_DATE_LOCALE, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: ARTICLE_DATE_TIME_ZONE,
  }).format(date)
}

export function isExternalArticleUrl(value: string) {
  return /^https?:\/\//i.test(value)
}
