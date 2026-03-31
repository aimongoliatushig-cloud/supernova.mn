import type { PublicContactSettings } from '@/lib/public/types'

export const DEFAULT_CONTACT_PHONE = '7000 0303'
export const DEFAULT_CONTACT_EMAIL = 'marketing@supernova.mn'
export const DEFAULT_CONTACT_ADDRESS =
  'БЗД 14-р хороо, ХӨСҮТ-ийн замын урд, BSB-тэй байрны баруун талаар байран дундуур ороход 1 давхартаа CU-тэй 4 давхар барилга, "СУПЕРНОВА ЭМНЭЛЭГ", Ulaanbaatar, Mongolia'

function looksCorruptedText(value: string | null | undefined) {
  if (!value) {
    return false
  }

  const replacementMatches = value.match(/[�]/g)?.length ?? 0
  const questionMatches = value.match(/\?/g)?.length ?? 0
  const mojibakeMatches = value.match(/[ÃÂÐÑÒÓ]/g)?.length ?? 0
  const repeatedQuestionMarks = /\?{2,}/.test(value)
  const hasFewCyrillicLetters = (value.match(/\p{Script=Cyrillic}/gu)?.length ?? 0) < 8
  const suspiciousQuestionDensity = questionMatches >= 3 && questionMatches / value.length > 0.05

  return (
    replacementMatches > 0 ||
    mojibakeMatches > 2 ||
    questionMatches > 6 ||
    repeatedQuestionMarks ||
    (suspiciousQuestionDensity && hasFewCyrillicLetters)
  )
}

export function sanitizeContactSettings(
  contact: PublicContactSettings | null
): PublicContactSettings | null {
  if (!contact) {
    return null
  }

  return {
    ...contact,
    phone: contact.phone?.trim() || DEFAULT_CONTACT_PHONE,
    email: contact.email?.trim() || DEFAULT_CONTACT_EMAIL,
    address:
      !contact.address?.trim() || looksCorruptedText(contact.address)
        ? DEFAULT_CONTACT_ADDRESS
        : contact.address.trim(),
  }
}
