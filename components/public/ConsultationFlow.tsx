'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Clock, MessageSquare, Phone, Shield } from 'lucide-react'
import { submitConsultationRequest } from '@/app/actions/public'
import Button from '@/components/ui/Button'

interface ConsultationFlowProps {
  privacyText: string
  initialLeadId?: string | null
  initialName?: string
  initialPhone?: string
  initialEmail?: string
}

const CALLBACK_OPTIONS = [
  { id: 'morning', label: 'Өглөө', time: '09:00 - 12:00', icon: '🌤️' },
  { id: 'afternoon', label: 'Үдээс хойш', time: '13:00 - 17:00', icon: '☀️' },
  { id: 'evening', label: 'Орой', time: '17:00 - 19:00', icon: '🌙' },
] as const

export default function ConsultationFlow({
  privacyText,
  initialLeadId,
  initialName = '',
  initialPhone = '',
  initialEmail = '',
}: ConsultationFlowProps) {
  const [fullName, setFullName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone)
  const [email, setEmail] = useState(initialEmail)
  const [callbackTime, setCallbackTime] =
    useState<(typeof CALLBACK_OPTIONS)[number]['id']>('morning')
  const [question, setQuestion] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSubmit() {
    startTransition(async () => {
      const result = await submitConsultationRequest({
        lead_id: initialLeadId,
        full_name: fullName,
        phone,
        email,
        preferred_callback_time: callbackTime,
        question,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      setError('')
      setSuccess(true)
    })
  }

  if (success) {
    const selectedOption = CALLBACK_OPTIONS.find((option) => option.id === callbackTime)

    return (
      <div className="min-h-screen bg-[#F7FAFF] px-4 py-20">
        <div className="mx-auto max-w-xl rounded-3xl border border-[#E5E7EB] bg-white p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#EAF3FF]">
            <CheckCircle2 size={32} className="text-[#1E63B5]" />
          </div>
          <h1 className="mt-5 text-2xl font-black text-[#1F2937]">
            Утасны зөвлөгөөний хүсэлт илгээгдлээ
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#6B7280]">
            Манай эмч, оффисын баг {selectedOption?.time} цагийн хооронд {phone} дугаарт
            холбогдоно.
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

  return (
    <div className="min-h-screen bg-[#F7FAFF]">
      <header className="sticky top-0 z-40 border-b border-[#E5E7EB] bg-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <Link href="/result" className="text-[#6B7280] hover:text-[#1E63B5]">
            <ArrowLeft size={18} />
          </Link>
          <span className="text-sm font-bold text-[#1F2937]">Үнэгүй утасны зөвлөгөө</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <section className="rounded-3xl bg-gradient-to-r from-[#1E63B5] to-[#154D8F] p-6 text-white">
          <div className="flex items-center gap-3">
            <Phone size={22} />
            <h1 className="text-lg font-black">15 минутын утасны зөвлөгөө</h1>
          </div>
          <p className="mt-3 text-sm leading-6 text-blue-100">
            Эмч таны асуултыг урьдчилан харж, оффисын баг CRM дээрээс эмчийн хариуг
            ашиглан холбогдох боломжтой байдлаар хүсэлтийг хадгална.
          </p>
        </section>

        <section className="rounded-3xl border border-[#E5E7EB] bg-white p-5">
          <h2 className="text-sm font-black uppercase tracking-wide text-[#1F2937]">
            Холбоо барих мэдээлэл
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1F2937]">
                Нэр <span className="text-[#F23645]">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1F2937]">
                Утасны дугаар <span className="text-[#F23645]">*</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#1F2937]">
                Имэйл <span className="text-xs font-normal text-[#9CA3AF]">(заавал биш)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#1F2937]">
            <Clock size={14} />
            Буцааж залгах цаг
          </h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {CALLBACK_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setCallbackTime(option.id)}
                className={[
                  'rounded-3xl border-2 px-4 py-5 text-center transition-all',
                  callbackTime === option.id
                    ? 'border-[#1E63B5] bg-[#EAF3FF]'
                    : 'border-[#E5E7EB] bg-white hover:border-[#1E63B5]/40',
                ].join(' ')}
              >
                <p className="text-2xl">{option.icon}</p>
                <p
                  className={[
                    'mt-2 text-sm font-black',
                    callbackTime === option.id ? 'text-[#1E63B5]' : 'text-[#1F2937]',
                  ].join(' ')}
                >
                  {option.label}
                </p>
                <p className="mt-1 text-xs text-[#6B7280]">{option.time}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[#E5E7EB] bg-white p-5">
          <label className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-[#1F2937]">
            <MessageSquare size={14} />
            Асуулт, тайлбар
          </label>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={5}
            className="mt-4 w-full resize-none rounded-2xl border border-[#E5E7EB] px-4 py-3 text-sm outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
            placeholder="Зовиур, эмчээс асуух зүйл, өмнөх оношилгооны тухай мэдээллээ үлдээнэ үү."
          />
        </section>

        {error ? <p className="text-sm font-medium text-[#F23645]">{error}</p> : null}

        <Button fullWidth size="xl" loading={pending} onClick={handleSubmit}>
          Зөвлөгөө хүсэх
        </Button>

        <div className="flex items-start gap-2 text-xs leading-5 text-[#9CA3AF]">
          <Shield size={14} className="mt-0.5 shrink-0 text-[#1E63B5]" />
          <span>{privacyText}</span>
        </div>
      </main>
    </div>
  )
}
