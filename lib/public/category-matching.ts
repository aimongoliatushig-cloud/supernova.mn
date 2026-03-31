const CATEGORY_SYNONYMS: Record<string, string[]> = {
  зүрх: ['зүрх', 'кардио', 'зүрх судас'],
  даралт: ['даралт', 'цусны даралт', 'судас'],
  ходоод: ['ходоод', 'хоол боловсруулах', 'гэдэс', 'дуран'],
  элэг: ['элэг'],
  бөөр: ['бөөр', 'шээс'],
  'бамбай булчирхай': ['бамбай', 'даавар', 'thyroid'],
  эмэгтэйчүүд: ['эмэгтэй', 'gyne'],
  'яс үе': ['яс', 'үе', 'dexa'],
  'хоол боловсруулах эрхтэн': ['хоол боловсруулах', 'гэдэс', 'дуран'],
  даавар: ['даавар', 'эндокрин'],
}

export function normalizeCategoryText(value: string | null | undefined) {
  return value?.toLowerCase().replace(/\s+/g, ' ').trim() ?? ''
}

function getBaseCategory(category: string) {
  const normalized = normalizeCategoryText(category)

  if (!normalized) {
    return ''
  }

  return (
    Object.keys(CATEGORY_SYNONYMS).find(
      (baseCategory) =>
        normalized.includes(baseCategory) || baseCategory.includes(normalized)
    ) ?? normalized
  )
}

export function getCategoryKeywords(categories: string[]) {
  const keywords = new Set<string>()

  for (const category of categories) {
    const normalized = normalizeCategoryText(category)

    if (!normalized) {
      continue
    }

    const baseCategory = getBaseCategory(normalized)
    keywords.add(baseCategory)
    keywords.add(normalized)

    for (const synonym of CATEGORY_SYNONYMS[baseCategory] ?? []) {
      keywords.add(normalizeCategoryText(synonym))
    }
  }

  return Array.from(keywords)
}

export function getCategoryMatchScore(
  text: string | null | undefined,
  categories: string[]
) {
  const normalizedText = normalizeCategoryText(text)

  if (!normalizedText) {
    return 0
  }

  const keywords = getCategoryKeywords(categories)

  return keywords.reduce((score, keyword) => {
    if (!keyword || !normalizedText.includes(keyword)) {
      return score
    }

    return score + 1
  }, 0)
}

export function findBestCategoryMatch(
  candidates: string[],
  selectedCategories: string[]
) {
  let bestCandidate: string | null = null
  let bestScore = 0

  for (const candidate of candidates) {
    const score = getCategoryMatchScore(candidate, selectedCategories)

    if (score > bestScore) {
      bestCandidate = candidate
      bestScore = score
    }
  }

  return bestCandidate
}
