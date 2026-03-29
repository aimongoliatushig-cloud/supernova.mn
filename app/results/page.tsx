'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { calculateTriage, getBodyPartById, type BodyPart } from '@/lib/symptoms-data'

const durationLabels: Record<string, string> = {
  today: 'Өнөөдөр эхэлсэн',
  days: 'Хэдэн өдрийн өмнө',
  week: 'Долоо хоногийн өмнө',
  month: 'Сарын өмнө буюу урт хугацаанд',
}

function ResultsContent() {
  const searchParams = useSearchParams()

  const bodyPartId = searchParams.get('bodyPart') || ''
  const symptomsRaw = searchParams.get('symptoms') || ''
  const duration = searchParams.get('duration') || ''
  const severity = Number(searchParams.get('severity') || '5')
  const notes = searchParams.get('notes') || ''

  const symptoms = symptomsRaw ? symptomsRaw.split('|') : []
  const bodyPartInfo = getBodyPartById(bodyPartId)
  const triage = bodyPartInfo
    ? calculateTriage(bodyPartId as BodyPart, symptoms, severity)
    : null

  if (!bodyPartInfo || !triage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow p-8 text-center max-w-sm">
          <div className="text-4xl mb-4">❓</div>
          <p className="text-slate-600 mb-4">Мэдээлэл олдсонгүй.</p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Дахин эхлэх
          </Link>
        </div>
      </div>
    )
  }

  const urgencyConfig = {
    emergency: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      badge: 'bg-red-600 text-white',
      icon: '🚨',
      titleColor: 'text-red-700',
    },
    urgent: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      badge: 'bg-yellow-500 text-white',
      icon: '⚠️',
      titleColor: 'text-yellow-700',
    },
    normal: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      badge: 'bg-green-600 text-white',
      icon: '✅',
      titleColor: 'text-green-700',
    },
  }

  const cfg = urgencyConfig[triage.urgency]

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
            <p className="text-blue-100 text-xs">Шалгалтын үр дүн</p>
            <h1 className="text-xl font-bold">Тайлан</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Urgency Card */}
        <div
          className={`${cfg.bg} border-2 ${cfg.border} rounded-2xl p-6 text-center`}
        >
          <div className="text-5xl mb-3">{cfg.icon}</div>
          <span
            className={`inline-block ${cfg.badge} px-4 py-1 rounded-full text-sm font-bold mb-3`}
          >
            {triage.urgencyLabel}
          </span>
          <p className={`${cfg.titleColor} font-semibold text-base`}>
            {triage.advice}
          </p>
        </div>

        {/* Doctor Recommendation */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">
            Санал болгох эмчийн төрөл
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-3xl">👨‍⚕️</span>
            <p className="text-slate-800 font-semibold text-base">
              {triage.doctorType}
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
          <h3 className="text-slate-700 font-bold text-base">
            Шалгалтын хураангуй
          </h3>

          {/* Body Part */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <span className="text-2xl">{bodyPartInfo.emoji}</span>
            <div>
              <p className="text-xs text-slate-400">Биеийн хэсэг</p>
              <p className="text-slate-700 font-medium">{bodyPartInfo.name}</p>
            </div>
          </div>

          {/* Symptoms */}
          <div className="pb-3 border-b border-slate-100">
            <p className="text-xs text-slate-400 mb-2">
              Сонгосон зовиурууд ({symptoms.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {symptoms.map((s) => (
                <span
                  key={s}
                  className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span className="text-xs text-slate-400">Үргэлжилсэн хугацаа</span>
            <span className="text-slate-700 text-sm font-medium">
              {durationLabels[duration] || duration}
            </span>
          </div>

          {/* Severity */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span className="text-xs text-slate-400">Зовиурын хүч</span>
            <span
              className={`text-sm font-bold ${
                severity >= 8
                  ? 'text-red-600'
                  : severity >= 5
                    ? 'text-yellow-600'
                    : 'text-green-600'
              }`}
            >
              {severity} / 10
            </span>
          </div>

          {/* Notes */}
          {notes && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Нэмэлт тайлбар</p>
              <p className="text-slate-700 text-sm bg-slate-50 rounded-xl p-3">
                {notes}
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-800 text-xs leading-relaxed">
            <strong>⚠️ Анхааруулга:</strong> Энэ үр дүн нь мэргэжлийн оношийг
            орлохгүй. Зөвхөн чиглүүлэх зорилготой. Яаралтай тусламж хэрэгтэй
            бол <strong>103</strong> дугаарт залгана уу.
          </p>
        </div>

        {/* Restart Button */}
        <Link
          href="/"
          className="block w-full bg-blue-600 text-white text-center py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors active:scale-95"
        >
          🔄 Дахин эхлэх
        </Link>
      </main>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="text-slate-500 text-lg">Уншиж байна...</div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
