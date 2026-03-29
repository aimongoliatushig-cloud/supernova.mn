'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import {
  deleteAnswerOption,
  deleteDiagnosisQuestion,
  deleteSymptomCategory,
  saveAnswerOption,
  saveDiagnosisQuestion,
  saveSymptomCategory,
} from '@/app/dashboard/admin/actions'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminMessage,
  AdminPageHeader,
  AdminSectionCard,
  AdminSelect,
  AdminTextArea,
  AdminToggle,
} from '@/components/admin/AdminPrimitives'
import { useServerAction } from '@/components/admin/useServerAction'
import type {
  DiagnosisAnswerOption,
  DiagnosisAnswerOptionInput,
  DiagnosisQuestion,
  DiagnosisQuestionInput,
  SymptomCategory,
  SymptomCategoryInput,
} from '@/lib/admin/types'

const blankCategory: SymptomCategoryInput = {
  name: '',
  slug: '',
  icon: '🩺',
  description: '',
  sort_order: 0,
  is_active: true,
  show_on_landing: true,
}

const blankQuestion: DiagnosisQuestionInput = {
  category_id: '',
  question_text: '',
  help_text: '',
  question_type: 'single',
  sort_order: 0,
  is_required: true,
  is_active: true,
  risk_weight: 1,
}

const blankAnswer: DiagnosisAnswerOptionInput = {
  question_id: '',
  option_text: '',
  recommendation: '',
  risk_score: 0,
  sort_order: 0,
  is_active: true,
}

function toCategoryInput(category?: SymptomCategory | null): SymptomCategoryInput {
  if (!category) {
    return blankCategory
  }

  return {
    id: category.id,
    name: category.name,
    slug: category.slug ?? '',
    icon: category.icon,
    description: category.description ?? '',
    sort_order: category.sort_order,
    is_active: category.is_active,
    show_on_landing: category.show_on_landing,
  }
}

function toQuestionInput(question?: DiagnosisQuestion | null): DiagnosisQuestionInput {
  if (!question) {
    return blankQuestion
  }

  return {
    id: question.id,
    category_id: question.category_id,
    question_text: question.question_text,
    help_text: question.help_text ?? '',
    question_type: question.question_type,
    sort_order: question.sort_order,
    is_required: question.is_required,
    is_active: question.is_active,
    risk_weight: question.risk_weight,
  }
}

function toAnswerInput(answer?: DiagnosisAnswerOption | null): DiagnosisAnswerOptionInput {
  if (!answer) {
    return blankAnswer
  }

  return {
    id: answer.id,
    question_id: answer.question_id,
    option_text: answer.option_text,
    recommendation: answer.recommendation ?? '',
    risk_score: answer.risk_score,
    sort_order: answer.sort_order,
    is_active: answer.is_active,
  }
}

export default function DiagnosisManager({
  initialCategories,
  initialQuestions,
  initialAnswerOptions,
}: {
  initialCategories: SymptomCategory[]
  initialQuestions: DiagnosisQuestion[]
  initialAnswerOptions: DiagnosisAnswerOption[]
}) {
  const { pending, error, success, runAction } = useServerAction()
  const [categories, setCategories] = useState(initialCategories)
  const [questions, setQuestions] = useState(initialQuestions)
  const [answerOptions, setAnswerOptions] = useState(initialAnswerOptions)

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialCategories[0]?.id ?? null
  )
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    initialQuestions[0]?.id ?? null
  )

  const [categoryForm, setCategoryForm] = useState<SymptomCategoryInput>(
    toCategoryInput(initialCategories[0] ?? null)
  )
  const [questionForm, setQuestionForm] = useState<DiagnosisQuestionInput>(
    toQuestionInput(initialQuestions[0] ?? null)
  )
  const [answerForm, setAnswerForm] = useState<DiagnosisAnswerOptionInput>(
    toAnswerInput(initialAnswerOptions[0] ?? null)
  )

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  useEffect(() => {
    setQuestions(initialQuestions)
  }, [initialQuestions])

  useEffect(() => {
    setAnswerOptions(initialAnswerOptions)
  }, [initialAnswerOptions])

  useEffect(() => {
    const selectedCategory =
      categories.find((category) => category.id === selectedCategoryId) ?? categories[0]
    setSelectedCategoryId(selectedCategory?.id ?? null)
    setCategoryForm(toCategoryInput(selectedCategory ?? null))
  }, [categories, selectedCategoryId])

  useEffect(() => {
    const categoryQuestions = questions.filter((question) => question.category_id === selectedCategoryId)
    const selectedQuestion =
      categoryQuestions.find((question) => question.id === selectedQuestionId) ?? categoryQuestions[0]

    setSelectedQuestionId(selectedQuestion?.id ?? null)
    setQuestionForm(
      selectedQuestion
        ? toQuestionInput(selectedQuestion)
        : {
            ...blankQuestion,
            category_id: selectedCategoryId ?? '',
          }
    )
  }, [questions, selectedCategoryId, selectedQuestionId])

  useEffect(() => {
    const questionAnswers = answerOptions.filter((answer) => answer.question_id === selectedQuestionId)
    const selectedAnswer = questionAnswers[0]

    setAnswerForm(
      selectedAnswer
        ? toAnswerInput(selectedAnswer)
        : {
            ...blankAnswer,
            question_id: selectedQuestionId ?? '',
          }
    )
  }, [answerOptions, selectedQuestionId])

  const categoryQuestions = useMemo(
    () => questions.filter((question) => question.category_id === selectedCategoryId),
    [questions, selectedCategoryId]
  )

  const questionAnswers = useMemo(
    () => answerOptions.filter((answer) => answer.question_id === selectedQuestionId),
    [answerOptions, selectedQuestionId]
  )

  function openCategory(category?: SymptomCategory) {
    setSelectedCategoryId(category?.id ?? null)
    setCategoryForm(toCategoryInput(category ?? null))
  }

  function openQuestion(question?: DiagnosisQuestion) {
    setSelectedQuestionId(question?.id ?? null)
    setQuestionForm(
      question
        ? toQuestionInput(question)
        : {
            ...blankQuestion,
            category_id: selectedCategoryId ?? '',
          }
    )
  }

  function openAnswer(answer?: DiagnosisAnswerOption) {
    setAnswerForm(
      answer
        ? toAnswerInput(answer)
        : {
            ...blankAnswer,
            question_id: selectedQuestionId ?? '',
          }
    )
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <AdminPageHeader
        eyebrow="Diagnosis Engine"
        title="Оношилгооны асуулгын хөдөлгүүр"
        description="Шинж тэмдгийн ангилал, follow-up асуулт, хариултын сонголт, эрсдэлийн score-ийг админаас бүрэн удирдах хэсэг."
      />

      {error ? <AdminMessage tone="error">{error}</AdminMessage> : null}
      {success ? <AdminMessage tone="success">{success}</AdminMessage> : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <AdminSectionCard
          title={selectedCategoryId ? 'Ангилал засах' : 'Шинэ ангилал'}
          description="Landing, diagnosis step 1 болон CRM тайлангийн root модуль."
          action={
            <button
              type="button"
              onClick={() => openCategory()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={14} />
              Шинэ ангилал
            </button>
          }
        >
          <div className="space-y-4">
            <AdminField label="Нэр" required>
              <AdminInput
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </AdminField>
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Slug">
                <AdminInput
                  value={categoryForm.slug}
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Icon">
                <AdminInput
                  value={categoryForm.icon}
                  onChange={(event) =>
                    setCategoryForm((current) => ({ ...current, icon: event.target.value }))
                  }
                />
              </AdminField>
            </div>
            <AdminField label="Тайлбар">
              <AdminTextArea
                rows={3}
                value={categoryForm.description}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </AdminField>
            <AdminField label="Дараалал">
              <AdminInput
                type="number"
                value={categoryForm.sort_order}
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    sort_order: Number(event.target.value),
                  }))
                }
              />
            </AdminField>
            <div className="flex flex-wrap gap-2">
              <AdminToggle
                label="Идэвхтэй"
                active={categoryForm.is_active}
                onClick={() =>
                  setCategoryForm((current) => ({
                    ...current,
                    is_active: !current.is_active,
                  }))
                }
              />
              <AdminToggle
                label="Landing дээр"
                active={categoryForm.show_on_landing}
                onClick={() =>
                  setCategoryForm((current) => ({
                    ...current,
                    show_on_landing: !current.show_on_landing,
                  }))
                }
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  runAction(() => saveSymptomCategory(categoryForm), {
                    successMessage: selectedCategoryId
                      ? 'Ангилал шинэчлэгдлээ.'
                      : 'Шинэ ангилал үүслээ.',
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-semibold text-white"
              >
                <Save size={16} />
                Хадгалах
              </button>
              {selectedCategoryId ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm('Энэ ангиллыг устгах уу?')) {
                      return
                    }

                    runAction(() => deleteSymptomCategory(selectedCategoryId), {
                      successMessage: 'Ангилал устгагдлаа.',
                    })
                    openCategory()
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#F7D5D9] bg-[#FFF1F2] px-4 py-3 text-sm font-semibold text-[#F23645]"
                >
                  <Trash2 size={16} />
                  Устгах
                </button>
              ) : null}
            </div>

            <div className="space-y-2 border-t border-[#E5E7EB] pt-4">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => openCategory(category)}
                  className={[
                    'w-full rounded-2xl border px-4 py-3 text-left transition',
                    selectedCategoryId === category.id
                      ? 'border-[#B8D5FB] bg-[#F7FAFF]'
                      : 'border-[#E5E7EB] bg-white',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#1F2937]">
                        {category.icon} {category.name}
                      </p>
                      <p className="text-sm text-[#6B7280]">{category.slug ?? 'slug оруулаагүй'}</p>
                    </div>
                    <span className="text-xs text-[#9CA3AF]">
                      {category.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          title={selectedQuestionId ? 'Асуулт засах' : 'Шинэ асуулт'}
          description="Сонгосон ангиллын дараагийн алхмын асуулт ба scoring weight."
          action={
            <button
              type="button"
              onClick={() => openQuestion()}
              disabled={!selectedCategoryId}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Plus size={14} />
              Шинэ асуулт
            </button>
          }
        >
          {!selectedCategoryId ? (
            <AdminEmptyState
              title="Ангилал сонгоно уу"
              description="Эхлээд зүүн талын жагсаалтаас ангилал сонгож асуултаа холбож өгнө."
            />
          ) : (
            <div className="space-y-4">
              <AdminField label="Асуултын текст" required>
                <AdminTextArea
                  rows={3}
                  value={questionForm.question_text}
                  onChange={(event) =>
                    setQuestionForm((current) => ({
                      ...current,
                      question_text: event.target.value,
                    }))
                  }
                />
              </AdminField>
              <AdminField label="Тайлбар / hint">
                <AdminInput
                  value={questionForm.help_text}
                  onChange={(event) =>
                    setQuestionForm((current) => ({
                      ...current,
                      help_text: event.target.value,
                    }))
                  }
                />
              </AdminField>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="Question type">
                  <AdminSelect
                    value={questionForm.question_type}
                    onChange={(event) =>
                      setQuestionForm((current) => ({
                        ...current,
                        question_type: event.target.value as DiagnosisQuestionInput['question_type'],
                      }))
                    }
                  >
                    <option value="single">Single choice</option>
                    <option value="multiple">Multiple choice</option>
                    <option value="slider">Slider</option>
                    <option value="text">Text</option>
                  </AdminSelect>
                </AdminField>
                <AdminField label="Risk weight">
                  <AdminInput
                    type="number"
                    step="0.1"
                    min={0}
                    value={questionForm.risk_weight}
                    onChange={(event) =>
                      setQuestionForm((current) => ({
                        ...current,
                        risk_weight: Number(event.target.value),
                      }))
                    }
                  />
                </AdminField>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="Дараалал">
                  <AdminInput
                    type="number"
                    min={0}
                    value={questionForm.sort_order}
                    onChange={(event) =>
                      setQuestionForm((current) => ({
                        ...current,
                        sort_order: Number(event.target.value),
                      }))
                    }
                  />
                </AdminField>
                <div className="flex flex-wrap items-end gap-2">
                  <AdminToggle
                    label="Required"
                    active={questionForm.is_required}
                    onClick={() =>
                      setQuestionForm((current) => ({
                        ...current,
                        is_required: !current.is_required,
                      }))
                    }
                  />
                  <AdminToggle
                    label="Идэвхтэй"
                    active={questionForm.is_active}
                    onClick={() =>
                      setQuestionForm((current) => ({
                        ...current,
                        is_active: !current.is_active,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    runAction(() => saveDiagnosisQuestion(questionForm), {
                      successMessage: selectedQuestionId
                        ? 'Асуулт шинэчлэгдлээ.'
                        : 'Шинэ асуулт үүслээ.',
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-semibold text-white"
                >
                  <Save size={16} />
                  Хадгалах
                </button>
                {selectedQuestionId ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm('Энэ асуултыг устгах уу?')) {
                        return
                      }

                      runAction(() => deleteDiagnosisQuestion(selectedQuestionId), {
                        successMessage: 'Асуулт устгагдлаа.',
                      })
                      openQuestion()
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#F7D5D9] bg-[#FFF1F2] px-4 py-3 text-sm font-semibold text-[#F23645]"
                  >
                    <Trash2 size={16} />
                    Устгах
                  </button>
                ) : null}
              </div>

              <div className="space-y-2 border-t border-[#E5E7EB] pt-4">
                {categoryQuestions.length === 0 ? (
                  <AdminEmptyState
                    title="Асуулт алга"
                    description="Энэ ангилалд асуулт нэмснээр public diagnosis flow шууд шинэчлэгдэнэ."
                  />
                ) : (
                  categoryQuestions.map((question) => (
                    <button
                      type="button"
                      key={question.id}
                      onClick={() => openQuestion(question)}
                      className={[
                        'w-full rounded-2xl border px-4 py-3 text-left transition',
                        selectedQuestionId === question.id
                          ? 'border-[#B8D5FB] bg-[#F7FAFF]'
                          : 'border-[#E5E7EB] bg-white',
                      ].join(' ')}
                    >
                      <p className="font-semibold text-[#1F2937]">{question.question_text}</p>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        {question.question_type} · weight {question.risk_weight}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </AdminSectionCard>

        <AdminSectionCard
          title={answerForm.id ? 'Хариулт засах' : 'Шинэ хариултын сонголт'}
          description="Асуулт бүрийн scoring option, зөвлөмжийн текст болон эрсдэлийн оноог удирдана."
          action={
            <button
              type="button"
              onClick={() => openAnswer()}
              disabled={!selectedQuestionId}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Plus size={14} />
              Шинэ сонголт
            </button>
          }
        >
          {!selectedQuestionId ? (
            <AdminEmptyState
              title="Асуулт сонгоно уу"
              description="Эхлээд дунд баганаас асуулт сонгож, түүнд харьяалах хариултын сонголтыг үүсгэнэ."
            />
          ) : (
            <div className="space-y-4">
              <AdminField label="Хариултын текст" required>
                <AdminInput
                  value={answerForm.option_text}
                  onChange={(event) =>
                    setAnswerForm((current) => ({
                      ...current,
                      option_text: event.target.value,
                    }))
                  }
                />
              </AdminField>
              <AdminField label="Зөвлөмжийн тайлбар">
                <AdminTextArea
                  rows={3}
                  value={answerForm.recommendation}
                  onChange={(event) =>
                    setAnswerForm((current) => ({
                      ...current,
                      recommendation: event.target.value,
                    }))
                  }
                />
              </AdminField>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="Risk score">
                  <AdminInput
                    type="number"
                    step="0.1"
                    value={answerForm.risk_score}
                    onChange={(event) =>
                      setAnswerForm((current) => ({
                        ...current,
                        risk_score: Number(event.target.value),
                      }))
                    }
                  />
                </AdminField>
                <AdminField label="Дараалал">
                  <AdminInput
                    type="number"
                    min={0}
                    value={answerForm.sort_order}
                    onChange={(event) =>
                      setAnswerForm((current) => ({
                        ...current,
                        sort_order: Number(event.target.value),
                      }))
                    }
                  />
                </AdminField>
              </div>
              <AdminToggle
                label="Идэвхтэй"
                active={answerForm.is_active}
                onClick={() =>
                  setAnswerForm((current) => ({
                    ...current,
                    is_active: !current.is_active,
                  }))
                }
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    runAction(() => saveAnswerOption(answerForm), {
                      successMessage: answerForm.id
                        ? 'Хариултын сонголт шинэчлэгдлээ.'
                        : 'Шинэ хариултын сонголт үүслээ.',
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-semibold text-white"
                >
                  <Save size={16} />
                  Хадгалах
                </button>
                {answerForm.id ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm('Энэ сонголтыг устгах уу?')) {
                        return
                      }

                      runAction(() => deleteAnswerOption(answerForm.id!), {
                        successMessage: 'Хариултын сонголт устгагдлаа.',
                      })
                      openAnswer()
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#F7D5D9] bg-[#FFF1F2] px-4 py-3 text-sm font-semibold text-[#F23645]"
                  >
                    <Trash2 size={16} />
                    Устгах
                  </button>
                ) : null}
              </div>

              <div className="space-y-2 border-t border-[#E5E7EB] pt-4">
                {questionAnswers.length === 0 ? (
                  <AdminEmptyState
                    title="Сонголт алга"
                    description="Single, multiple, slider төрлийн асуултад сонголтуудаа нэмж scoring-оо удирдана."
                  />
                ) : (
                  questionAnswers.map((answer) => (
                    <button
                      type="button"
                      key={answer.id}
                      onClick={() => openAnswer(answer)}
                      className={[
                        'w-full rounded-2xl border px-4 py-3 text-left transition',
                        answerForm.id === answer.id
                          ? 'border-[#B8D5FB] bg-[#F7FAFF]'
                          : 'border-[#E5E7EB] bg-white',
                      ].join(' ')}
                    >
                      <p className="font-semibold text-[#1F2937]">{answer.option_text}</p>
                      <p className="mt-1 text-sm text-[#6B7280]">
                        Score {answer.risk_score}
                        {answer.recommendation ? ` · ${answer.recommendation}` : ''}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </AdminSectionCard>
      </div>
    </div>
  )
}
