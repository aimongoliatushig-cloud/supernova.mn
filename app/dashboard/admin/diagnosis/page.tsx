import DiagnosisManager from '@/components/admin/DiagnosisManager'
import { getDiagnosisAdminData } from '@/lib/admin/data'

export default async function AdminDiagnosisPage() {
  const { categories, questions, answerOptions } = await getDiagnosisAdminData()

  return (
    <DiagnosisManager
      initialCategories={categories}
      initialQuestions={questions}
      initialAnswerOptions={answerOptions}
    />
  )
}
