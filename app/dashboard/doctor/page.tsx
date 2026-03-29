'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, CheckCircle2, Clock, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'

interface Consultation {
  id: string
  lead_id: string
  preferred_callback_time: 'morning' | 'afternoon' | 'evening'
  question: string | null
  status: 'new' | 'answered' | 'called' | 'closed'
  created_at: string
  leads?: { full_name: string; phone: string; risk_level: string | null }
  doctor_responses?: { response_text: string; created_at: string }[]
}

const timeLabels = { morning: 'Өглөө', afternoon: 'Үдээс хойш', evening: 'Орой' }
const statusColors = {
  new:      'red',
  answered: 'green',
  called:   'blue',
  closed:   'gray',
} as const
const statusLabels = {
  new:      'Шинэ',
  answered: 'Хариулсан',
  called:   'Залгасан',
  closed:   'Дууссан',
}

const MOCK: Consultation[] = [
  {
    id: '1', lead_id: 'l1', preferred_callback_time: 'morning', status: 'new', created_at: new Date(Date.now() - 3600000).toISOString(),
    question: 'Зүрх дэлсэх мэдрэмж 2 долоо хоног болоод байна. Ямар шинжилгээ хийлгэх вэ?',
    leads: { full_name: 'Б. Оюунаа', phone: '9911-2233', risk_level: 'high' },
    doctor_responses: [],
  },
  {
    id: '2', lead_id: 'l2', preferred_callback_time: 'afternoon', status: 'answered', created_at: new Date(Date.now() - 86400000).toISOString(),
    question: 'Ходоодны өвдөлт хоол идсэний дараа хурцдана. Яах вэ?',
    leads: { full_name: 'Д. Батболд', phone: '9922-3344', risk_level: 'medium' },
    doctor_responses: [{ response_text: 'Ходоодны дурангийн шинжилгээ хийлгэхийг зөвлөж байна.', created_at: new Date().toISOString() }],
  },
]

export default function DoctorDashboard() {
  const supabase = createClient()
  const [consultations, setConsultations] = useState<Consultation[]>(MOCK)
  const [selected,      setSelected]      = useState<Consultation | null>(null)
  const [response,      setResponse]      = useState('')
  const [loading,       setLoading]       = useState(false)
  const [filter,        setFilter]        = useState<string>('all')

  const fetchConsultations = useCallback(async () => {
    const { data, error } = await supabase
      .from('consultation_requests')
      .select('*, leads(full_name, phone, risk_level), doctor_responses(*)')
      .order('created_at', { ascending: false })
    if (!error && data && data.length > 0) setConsultations(data as unknown as Consultation[])
  }, [supabase])

  useEffect(() => { fetchConsultations() }, [fetchConsultations])

  const displayed = filter === 'all'
    ? consultations
    : consultations.filter((c) => c.status === filter)

  async function submitResponse() {
    if (!selected || !response.trim()) return
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: doc } = await supabase
        .from('doctors')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (doc) {
        await supabase.from('doctor_responses').insert({
          consultation_id: selected.id,
          doctor_id: doc.id,
          response_text: response,
        })
      }
    }
    await supabase
      .from('consultation_requests')
      .update({ status: 'answered' })
      .eq('id', selected.id)

    const newResp = { response_text: response, created_at: new Date().toISOString() }
    setConsultations((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? { ...c, status: 'answered', doctor_responses: [...(c.doctor_responses ?? []), newResp] }
          : c
      )
    )
    setSelected((p) => p ? { ...p, status: 'answered', doctor_responses: [...(p.doctor_responses ?? []), newResp] } : p)
    setResponse('')
    setLoading(false)
  }

  const stats = {
    total:    consultations.length,
    new:      consultations.filter((c) => c.status === 'new').length,
    answered: consultations.filter((c) => c.status === 'answered').length,
  }

  return (
    <div className="p-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Нийт',      value: stats.total,    color: '#1E63B5' },
          { label: 'Шинэ',      value: stats.new,      color: '#E8323F' },
          { label: 'Хариулсан', value: stats.answered, color: '#16A34A' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E5E7EB] p-4 text-center">
            <div className="text-3xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs text-[#6B7280] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-6">
        {/* List */}
        <div className="flex-1 min-w-0">
          {/* Filter */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-3 mb-4 flex gap-2">
            {['all', ...Object.keys(statusLabels)].map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={[
                  'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
                  filter === s
                    ? 'bg-[#1E63B5] text-white'
                    : 'bg-[#F7FAFF] text-[#6B7280] hover:bg-[#EAF3FF]',
                ].join(' ')}
              >
                {s === 'all' ? 'Бүгд' : statusLabels[s as keyof typeof statusLabels]}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {displayed.map((c) => (
              <div
                key={c.id}
                onClick={() => { setSelected(c); setResponse('') }}
                className={[
                  'bg-white rounded-2xl border-2 p-4 cursor-pointer transition-all hover:shadow-sm',
                  selected?.id === c.id ? 'border-[#1E63B5]' : 'border-[#E5E7EB]',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="font-bold text-[#1F2937] text-sm">{c.leads?.full_name}</div>
                    <div className="text-xs text-[#9CA3AF] flex items-center gap-2">
                      <Clock size={11} /> {timeLabels[c.preferred_callback_time]}
                      <span>·</span>
                      {new Date(c.created_at).toLocaleDateString('mn-MN')}
                    </div>
                  </div>
                  <Badge color={statusColors[c.status]}>{statusLabels[c.status]}</Badge>
                </div>
                {c.question && (
                  <p className="text-sm text-[#6B7280] line-clamp-2 leading-relaxed">{c.question}</p>
                )}
                {c.doctor_responses && c.doctor_responses.length > 0 && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-[#16A34A]">
                    <CheckCircle2 size={12} /> Хариулт өгсөн
                  </div>
                )}
              </div>
            ))}
            {displayed.length === 0 && (
              <div className="text-center py-12 text-[#9CA3AF]">Зөвлөгөөний хүсэлт байхгүй</div>
            )}
          </div>
        </div>

        {/* Detail */}
        {selected && (
          <div className="w-96 bg-white rounded-2xl border border-[#E5E7EB] p-5 h-fit sticky top-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-black text-[#1F2937]">{selected.leads?.full_name}</h3>
                <div className="text-xs text-[#6B7280] mt-0.5">{selected.leads?.phone}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-[#9CA3AF] text-xl">×</button>
            </div>

            <div className="mb-4">
              <div className="text-xs text-[#6B7280] mb-1">Хүссэн цаг</div>
              <div className="text-sm font-medium text-[#1F2937]">{timeLabels[selected.preferred_callback_time]}</div>
            </div>

            {selected.question && (
              <div className="mb-4">
                <div className="text-xs text-[#6B7280] mb-1 flex items-center gap-1">
                  <MessageSquare size={12} /> Өвчтөний асуулт
                </div>
                <div className="bg-[#F7FAFF] rounded-xl p-3 text-sm text-[#1F2937] leading-relaxed">
                  {selected.question}
                </div>
              </div>
            )}

            {/* Previous responses */}
            {selected.doctor_responses?.map((r, i) => (
              <div key={i} className="mb-3">
                <div className="text-xs text-[#6B7280] mb-1">✅ Эмчийн хариулт</div>
                <div className="bg-[#DCFCE7] border border-[#bbf7d0] rounded-xl p-3 text-sm text-[#166534]">
                  {r.response_text}
                </div>
              </div>
            ))}

            {/* Response input */}
            {selected.status === 'new' && (
              <div>
                <div className="text-xs text-[#6B7280] mb-1.5">Хариулт бичих</div>
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                  placeholder="Мэргэжлийн зөвлөгөө бичнэ үү..."
                  className="w-full px-3 py-3 text-sm rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1E63B5] resize-none mb-2"
                />
                <Button fullWidth loading={loading} onClick={submitResponse} disabled={!response.trim()}>
                  <Send size={14} /> Хариулт илгээх
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
