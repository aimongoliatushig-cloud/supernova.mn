'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { submitAssessment } from '@/app/actions/public'
import FlowHeader from '@/components/public/FlowHeader'
import Button from '@/components/ui/Button'
import type { PublicDiagnosisCategory } from '@/lib/public/types'

type Step = 'categories' | 'questions' | 'contact'

interface CheckFlowProps {
  categories: PublicDiagnosisCategory[]
  privacyText: string
}

export default function CheckFlow({ categories, privacyText }: CheckFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('categories')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [contact, setContact] = useState({ full_name: '', phone: '', email: '' })
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const selectedCategories = useMemo(
    () => categories.filter((category) => selectedCategoryIds.includes(category.id)),
    [categories, selectedCategoryIds]
  )

  const currentCategory = selectedCategories[currentCategoryIndex] ?? null
  const currentQuestion = currentCategory?.questions[currentQuestionIndex] ?? null

  const totalQuestions = selectedCategories.reduce(
    (total, category) => total + category.questions.length,
    0
  )

  const answeredQuestions =
    selectedCategories
      .slice(0, currentCategoryIndex)
      .reduce((total, category) => total + category.questions.length, 0) + currentQuestionIndex

  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

  function toggleCategory(categoryId: string) {
    setSelectedCategoryIds((current) =>
      current.includes(categoryId)
        ? current.filter((id) => id !== categoryId)
        : [...current, categoryId]
    )
  }

  function goToQuestions() {
    if (selectedCategoryIds.length === 0) {
      return
    }

    setCurrentCategoryIndex(0)
    setCurrentQuestionIndex(0)
    setStep('questions')
  }

  function answerQuestion(answerOptionId: string) {
    if (!currentQuestion) {
      return
    }

    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: answerOptionId,
    }))

    if (currentQuestionIndex < (currentCategory?.questions.length ?? 0) - 1) {
      setCurrentQuestionIndex((current) => current + 1)
      return
    }

    if (currentCategoryIndex < selectedCategories.length - 1) {
      setCurrentCategoryIndex((current) => current + 1)
      setCurrentQuestionIndex(0)
      return
    }

    setStep('contact')
  }

  function goBackQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((current) => current - 1)
      return
    }

    if (currentCategoryIndex > 0) {
      const previousCategory = selectedCategories[currentCategoryIndex - 1]
      setCurrentCategoryIndex((current) => current - 1)
      setCurrentQuestionIndex(previousCategory.questions.length - 1)
      return
    }

    setStep('categories')
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitAssessment({
        full_name: contact.full_name,
        phone: contact.phone,
        email: contact.email,
        category_ids: selectedCategoryIds,
        answers: Object.entries(answers).map(([question_id, answer_option_id]) => ({
          question_id,
          answer_option_id,
        })),
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      if (!result.data) {
        setError('Үнэлгээ хадгалагдсангүй.')
        return
      }

      router.push(`/result?assessment=${encodeURIComponent(result.data.assessmentId)}`)
    })
  }

  if (categories.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7FAFF] px-4 py-20">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center">
          <p className="text-sm font-semibold text-[#1E63B5]">Оношилгооны систем</p>
          <h1 className="mt-3 text-2xl font-black text-[#1F2937]">
            Идэвхтэй асуулгын өгөгдөл алга байна
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            Super Admin хэсгээс шинж тэмдгийн ангилал, асуулт, хариултын сонголтуудаа
            идэвхжүүлсний дараа энэ урсгал автоматаар ажиллана.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#1E63B5] px-6 py-3 text-sm font-bold text-white"
          >
            Нүүр хуудас руу буцах
          </Link>
        </div>
      </div>
    )
  }

  if (step === 'categories') {
    return (
      <div className="min-h-screen bg-[#F7FAFF]">
        <FlowHeader
          title="Эрүүл мэндийн шалгалт"
          backHref="/"
          backLabel="Нүүр"
          maxWidthClassName="max-w-3xl"
        />

        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="mb-6 flex items-center gap-2 text-xs">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E63B5] font-bold text-white">
              1
            </span>
            <span className="font-semibold text-[#1E63B5]">Ангилал сонгох</span>
            <div className="mx-1 h-px flex-1 bg-[#E5E7EB]" />
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E5E7EB] font-bold text-[#9CA3AF]">
              2
            </span>
            <span className="text-[#9CA3AF]">Асуулга</span>
            <div className="mx-1 h-px flex-1 bg-[#E5E7EB]" />
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#E5E7EB] font-bold text-[#9CA3AF]">
              3
            </span>
            <span className="text-[#9CA3AF]">Үр дүн</span>
          </div>

          <h1 className="text-2xl font-black text-[#1F2937]">Ямар чиглэлээр зовиур байна вэ?</h1>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            Нэг эсвэл хэд хэдэн ангилал сонгоход тухайн ангиллын идэвхтэй асуултууд
            автоматаар ачааллана.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {categories.map((category) => {
              const selected = selectedCategoryIds.includes(category.id)

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className={[
                    'relative rounded-3xl border-2 p-4 text-left transition-all',
                    selected
                      ? 'border-[#1E63B5] bg-[#EAF3FF]'
                      : 'border-[#E5E7EB] bg-white hover:border-[#1E63B5]/40',
                  ].join(' ')}
                >
                  {selected ? (
                    <CheckCircle2
                      size={18}
                      className="absolute right-4 top-4 text-[#1E63B5] fill-current"
                    />
                  ) : null}
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <div>
                      <p
                        className={[
                          'text-sm font-black',
                          selected ? 'text-[#1E63B5]' : 'text-[#1F2937]',
                        ].join(' ')}
                      >
                        {category.name}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[#6B7280]">
                        {category.description ?? 'Энэ ангиллын асуулгаар эрсдэлийн үнэлгээ хийнэ.'}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-[#9CA3AF]">
                        {category.questions.length} асуулт
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {selectedCategoryIds.length > 0 ? (
            <div className="mt-5 flex items-center justify-between rounded-2xl border border-[#B8D5FB] bg-[#EAF3FF] px-4 py-3 text-sm">
              <span className="font-semibold text-[#1E63B5]">
                {selectedCategoryIds.length} ангилал сонгосон
              </span>
              <span className="text-[#6B7280]">Нийт {totalQuestions} асуулт</span>
            </div>
          ) : null}

          <div className="mt-6">
            <Button fullWidth size="xl" disabled={selectedCategoryIds.length === 0} onClick={goToQuestions}>
              Үргэлжлүүлэх
              <ArrowRight size={18} />
            </Button>
          </div>
        </main>
      </div>
    )
  }

  if (step === 'questions' && currentCategory && currentQuestion) {
    const selectedAnswerId = answers[currentQuestion.id]

    return (
      <div className="min-h-screen bg-[#F7FAFF]">
        <FlowHeader
          title={currentCategory.name}
          onBack={goBackQuestion}
          backLabel="Буцах"
          rightSlot={
            <span>
              {answeredQuestions + 1} / {totalQuestions}
            </span>
          }
          maxWidthClassName="max-w-3xl"
        >
          <div className="h-1 bg-[#E5E7EB]">
            <div
              className="h-1 bg-[#1E63B5] transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </FlowHeader>

        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-xs font-semibold text-[#6B7280]">
            <span>{currentCategory.icon}</span>
            {currentCategory.name}
          </div>

          <h1 className="mt-5 text-2xl font-black leading-tight text-[#1F2937]">
            {currentQuestion.question_text}
          </h1>
          {currentQuestion.help_text ? (
            <p className="mt-3 text-sm leading-6 text-[#6B7280]">{currentQuestion.help_text}</p>
          ) : null}

          <div className="mt-6 space-y-3">
            {currentQuestion.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => answerQuestion(option.id)}
                className={[
                  'w-full rounded-2xl border-2 px-5 py-4 text-left text-sm font-semibold transition-all',
                  selectedAnswerId === option.id
                    ? 'border-[#1E63B5] bg-[#EAF3FF] text-[#1E63B5]'
                    : 'border-[#E5E7EB] bg-white text-[#1F2937] hover:border-[#1E63B5]/40',
                ].join(' ')}
              >
                {option.option_text}
              </button>
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7FAFF]">
      <FlowHeader
        title="Холбоо барих мэдээлэл"
        onBack={() => setStep('questions')}
        backLabel="Буцах"
        rightSlot={
          <span className="inline-flex items-center gap-1 text-[#16A34A]">
            <CheckCircle2 size={14} />
            <span className="hidden sm:inline">Бэлэн</span>
          </span>
        }
        maxWidthClassName="max-w-3xl"
      >
        <div className="h-1 bg-[#1E63B5]" />
      </FlowHeader>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6">
          <h1 className="text-2xl font-black text-[#1F2937]">Үр дүнгээ харахын тулд холбоо барих мэдээллээ үлдээнэ үү</h1>
          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            Эрсдэлийн үнэлгээг CRM рүү хадгалж, эмчийн цаг болон үнэгүй утасны зөвлөгөө
            рүү шууд шилжих боломжтой болно.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1F2937]">
                Нэр <span className="text-[#F23645]">*</span>
              </label>
              <input
                type="text"
                value={contact.full_name}
                onChange={(event) =>
                  setContact((current) => ({ ...current, full_name: event.target.value }))
                }
                className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                placeholder="Жишээ: Бат-Эрдэнэ"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1F2937]">
                Утасны дугаар <span className="text-[#F23645]">*</span>
              </label>
              <input
                type="tel"
                value={contact.phone}
                onChange={(event) =>
                  setContact((current) => ({ ...current, phone: event.target.value }))
                }
                className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                placeholder="9911-2233"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1F2937]">
                Имэйл <span className="text-xs font-normal text-[#9CA3AF]">(заавал биш)</span>
              </label>
              <input
                type="email"
                value={contact.email}
                onChange={(event) =>
                  setContact((current) => ({ ...current, email: event.target.value }))
                }
                className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                placeholder="name@example.com"
              />
            </div>
          </div>

          {error ? <p className="mt-4 text-sm font-medium text-[#F23645]">{error}</p> : null}

          <div className="mt-6">
            <Button fullWidth size="xl" loading={pending} onClick={handleSubmit}>
              Үр дүн харах
              <ArrowRight size={18} />
            </Button>
          </div>

          <p className="mt-4 text-xs leading-5 text-[#9CA3AF]">{privacyText}</p>
        </div>
      </main>
    </div>
  )
}
