import type { RiskLevel } from '@/lib/admin/types'
import type { PublicDiagnosisCategory } from '@/lib/public/types'

export function calculateAssessmentRisk(
  categories: PublicDiagnosisCategory[],
  answers: Record<string, string>
) {
  let totalWeightedRisk = 0
  let totalWeight = 0

  for (const category of categories) {
    for (const question of category.questions) {
      if (question.options.length === 0) {
        continue
      }

      const selectedOptionId = answers[question.id]
      const selectedOption = question.options.find((option) => option.id === selectedOptionId)

      if (!selectedOption) {
        continue
      }

      const maxQuestionScore = question.options.reduce(
        (currentMax, option) => Math.max(currentMax, option.risk_score),
        0
      )

      totalWeightedRisk += selectedOption.risk_score * question.risk_weight
      totalWeight += maxQuestionScore * question.risk_weight
    }
  }

  if (totalWeight <= 0) {
    return { score: 0, level: 'low' as RiskLevel }
  }

  const score = Math.min(100, Math.round((totalWeightedRisk / totalWeight) * 100))
  const level: RiskLevel = score >= 55 ? 'high' : score >= 30 ? 'medium' : 'low'

  return { score, level }
}
