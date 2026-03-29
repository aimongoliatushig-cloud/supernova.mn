'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBodyPartById } from '@/lib/symptoms-data'

const durationOptions = [
  { value: 'today', label: 'Өнөөдөр эхэлсэн' },
  { value: 'days', label: 'Хэдэн өдрийн өмнө' },
  { value: 'week', label: 'Долоо хоногийн өмнө' },
  { value: 'month', label: 'Сарын өмнө буюу урт хугацаанд' },
]

export default function SymptomsPage({
  params,
}: {
  params: Promise<{ bodyPart: string }>
}) {
  const { bodyPart } = use(params)
  const router = useRouter()

  const bodyPartInfo = getBodyPartById(bodyPart)

  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [duration, setDuration] = useState('')
  const [severity, setSeverity] = useState(5)
  const [notes, setNotes] = useState('')

  if (!bodyPartInfo) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-sm">
          <div className="text-4xl mb-4">❓</div>
          <p className="text-slate-600 mb-4">Биеийн хэсэг олдсонгүй.</p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Нүүр хуудас руу буцах
          </Link>
        </div>
      </div>
    )
  }

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom]
    )
  }

  const handleContinue = () => {
    if (selectedSymptoms.length === 0) return
    setShowFollowUp(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = () => {
    if (!duration) return
    const params = new URLSearchParams({
      bodyPart: bodyPart,
      symptoms: selectedSymptoms.join('|'),
      duration,
      severity: severity.toString(),
      notes,
    })
    router.push(`/results?${params.toString()}`)
  }

  const severityColor =
    severity <= 3
      ? 'text-green-600'
      : severity <= 6
        ? 'text-yellow-600'
        : 'text-red-600'

  const severityLabel =
    severity <= 3 ? 'Хөнгөн' : severity <= 6 ? 'Дунд' : 'Хүнд'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-4">
          <Link
            href="/"
            className="text-white/80 hover:text-white transition-colors text-2xl"
          >
            ←
          </Link>
          <div>
            <div className="text-2xl">{bodyPartInfo.emoji}</div>
            <h1 className="text-xl font-bold">{bodyPartInfo.name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {!showFollowUp ? (
          <>
            {/* Symptom Selection */}
            <h2 className="text-lg font-semibold text-slate-700 mb-2">
              Зовиурыг сонгоно уу
            </h2>
            <p className="text-slate-500 text-sm mb-5">
              Нэг буюу хэд хэдэн зовиур сонгож болно
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              {bodyPartInfo.symptoms.map((symptom) => {
                const selected = selectedSymptoms.includes(symptom)
                return (
                  <button
                    key={symptom}
                    onClick={() => toggleSymptom(symptom)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all duration-150 active:scale-95 min-h-[48px] ${
                      selected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {selected && <span className="mr-1">✓</span>}
                    {symptom}
                  </button>
                )
              })}
            </div>

            {selectedSymptoms.length > 0 && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="text-blue-700 text-sm font-medium">
                  {selectedSymptoms.length} зовиур сонгогдсон
                </p>
              </div>
            )}

            <button
              onClick={handleContinue}
              disabled={selectedSymptoms.length === 0}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              Үргэлжлүүлэх →
            </button>
          </>
        ) : (
          <>
            {/* Follow-up Questions */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="text-blue-800 font-semibold text-sm mb-2">
                Сонгосон зовиурууд:
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedSymptoms.map((s) => (
                  <span
                    key={s}
                    className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {/* Duration */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <label className="block text-slate-700 font-semibold mb-3">
                  🗓️ Хэзээнээс эхэлсэн?
                </label>
                <div className="space-y-2">
                  {durationOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDuration(opt.value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        duration === opt.value
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      {duration === opt.value ? '✓ ' : ''}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Severity Slider */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <label className="block text-slate-700 font-semibold mb-1">
                  💊 Хүч нь хэр вэ?
                </label>
                <div className={`text-2xl font-bold mb-3 ${severityColor}`}>
                  {severity} / 10{' '}
                  <span className="text-base font-normal">— {severityLabel}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>1 — Маш хөнгөн</span>
                  <span>10 — Маш хүнд</span>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <label className="block text-slate-700 font-semibold mb-2">
                  📝 Нэмэлт тайлбар{' '}
                  <span className="text-slate-400 font-normal text-sm">
                    (заавал биш)
                  </span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Нэмэлт мэдээлэл байвал бичнэ үү..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowFollowUp(false)}
                className="flex-1 bg-slate-100 text-slate-700 py-4 rounded-xl font-semibold hover:bg-slate-200 transition-colors active:scale-95"
              >
                ← Буцах
              </button>
              <button
                onClick={handleSubmit}
                disabled={!duration}
                className="flex-2 bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
              >
                Үр дүнг харах →
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
