'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Filter, Download, Phone, Calendar, MessageSquare, StickyNote, Users, TrendingUp, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import * as XLSX from 'xlsx'

type RiskLevel = 'low' | 'medium' | 'high'
type LeadStatus = 'new' | 'contacted' | 'pending' | 'confirmed' | 'blacklisted'

interface Lead {
  id: string
  full_name: string
  phone: string
  email: string | null
  risk_level: RiskLevel | null
  status: LeadStatus
  created_at: string
  categories_selected: string[] | null
  notes: string | null
}

const riskColors: Record<RiskLevel, 'red' | 'yellow' | 'green'> = {
  high:   'red',
  medium: 'yellow',
  low:    'green',
}
const riskLabels: Record<RiskLevel, string> = {
  high:   'Өндөр',
  medium: 'Дунд',
  low:    'Бага',
}
const statusColors: Record<LeadStatus, 'red' | 'yellow' | 'green' | 'blue' | 'gray'> = {
  new:         'blue',
  contacted:   'yellow',
  pending:     'gray',
  confirmed:   'green',
  blacklisted: 'red',
}
const statusLabels: Record<LeadStatus, string> = {
  new:         'Шинэ',
  contacted:   'Холбогдсон',
  pending:     'Хүлээгдэж буй',
  confirmed:   'Баталгаажсан',
  blacklisted: 'Хориглогдсон',
}

// ─── Mock data for when Supabase is not configured ────────────────────────────
const MOCK_LEADS: Lead[] = [
  { id: '1', full_name: 'Б. Оюунаа',   phone: '9911-2233', email: null,                 risk_level: 'high',   status: 'new',       created_at: new Date(Date.now() - 86400000).toISOString(),   categories_selected: ['heart', 'bp'], notes: null },
  { id: '2', full_name: 'Д. Батболд',  phone: '9922-3344', email: 'bat@gmail.com',      risk_level: 'medium', status: 'contacted', created_at: new Date(Date.now() - 172800000).toISOString(), categories_selected: ['stomach'],     notes: 'Маргааш дахин залгах' },
  { id: '3', full_name: 'С. Мөнхзул', phone: '9933-4455', email: null,                 risk_level: 'low',    status: 'confirmed', created_at: new Date(Date.now() - 259200000).toISOString(), categories_selected: ['thyroid'],     notes: null },
  { id: '4', full_name: 'Г. Тэмүүжин', phone: '9944-5566', email: 'temujin@gmail.com', risk_level: 'high',   status: 'pending',   created_at: new Date(Date.now() - 345600000).toISOString(), categories_selected: ['liver', 'kidney'], notes: 'Дахин залгах хэрэгтэй' },
  { id: '5', full_name: 'Н. Цэцэг',   phone: '9955-6677', email: null,                 risk_level: 'medium', status: 'new',       created_at: new Date(Date.now() - 432000000).toISOString(), categories_selected: ['women'],       notes: null },
]

export default function AssistantDashboard() {
  const supabase   = createClient()
  const [leads,    setLeads]    = useState<Lead[]>(MOCK_LEADS)
  const [filtered, setFiltered] = useState<Lead[]>(MOCK_LEADS)
  const [search,   setSearch]   = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [riskFilter,   setRiskFilter]   = useState<string>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [noteText,     setNoteText]     = useState('')
  const [loading,      setLoading]      = useState(false)

  const fetchLeads = useCallback(async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (!error && data && data.length > 0) {
      setLeads(data as Lead[])
    }
  }, [supabase])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  useEffect(() => {
    let result = leads
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (l) => l.full_name.toLowerCase().includes(q) || l.phone.includes(q)
      )
    }
    if (statusFilter !== 'all') result = result.filter((l) => l.status === statusFilter)
    if (riskFilter   !== 'all') result = result.filter((l) => l.risk_level === riskFilter)
    setFiltered(result)
  }, [leads, search, statusFilter, riskFilter])

  async function updateStatus(leadId: string, status: LeadStatus) {
    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, status } : l))
    if (selectedLead?.id === leadId) setSelectedLead((p) => p ? { ...p, status } : p)
    await supabase.from('leads').update({ status }).eq('id', leadId)
  }

  async function addNote() {
    if (!selectedLead || !noteText.trim()) return
    setLoading(true)
    const merged = [selectedLead.notes, noteText.trim()].filter(Boolean).join('\n— ')
    await supabase.from('leads').update({ notes: merged }).eq('id', selectedLead.id)
    setLeads((prev) => prev.map((l) => l.id === selectedLead.id ? { ...l, notes: merged } : l))
    setSelectedLead((p) => p ? { ...p, notes: merged } : p)
    setNoteText('')
    setLoading(false)
  }

  function exportToExcel() {
    const rows = filtered.map((l) => ({
      Нэр: l.full_name,
      Утас: l.phone,
      Имэйл: l.email ?? '',
      Эрсдэл: l.risk_level ? riskLabels[l.risk_level] : '',
      Статус: statusLabels[l.status],
      Бүртгүүлсэн: new Date(l.created_at).toLocaleDateString('mn-MN'),
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Хэрэглэгчид')
    XLSX.writeFile(wb, `supernova-leads-${Date.now()}.xlsx`)
  }

  // Stats
  const stats = {
    total:    leads.length,
    high:     leads.filter((l) => l.risk_level === 'high').length,
    newToday: leads.filter((l) => new Date(l.created_at).toDateString() === new Date().toDateString()).length,
    pending:  leads.filter((l) => l.status === 'pending' || l.status === 'new').length,
  }

  return (
    <div className="p-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Нийт хэрэглэгч', value: stats.total,    icon: <Users size={18} />,       color: '#1E63B5' },
          { label: 'Өнөөдөр',         value: stats.newToday, icon: <Clock size={18} />,       color: '#16A34A' },
          { label: 'Өндөр эрсдэл',    value: stats.high,     icon: <TrendingUp size={18} />,  color: '#E8323F' },
          { label: 'Хүлээгдэж буй',   value: stats.pending,  icon: <Calendar size={18} />,    color: '#D97706' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-[#E5E7EB] p-4">
            <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
              <span style={{ color: s.color }}>{s.icon}</span>
              {s.label}
            </div>
            <div className="text-3xl font-black" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Lead list */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] p-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-48 relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Нэр эсвэл утасны дугаар хайх..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E63B5]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={15} className="text-[#9CA3AF]" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E63B5]"
                >
                  <option value="all">Бүх статус</option>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  className="border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E63B5]"
                >
                  <option value="all">Бүх эрсдэл</option>
                  {Object.entries(riskLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>

              <Button variant="secondary" size="sm" onClick={exportToExcel}>
                <Download size={14} /> Excel
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Нэр</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Утас</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] hidden md:table-cell">Эрсдэл</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280]">Статус</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] hidden lg:table-cell">Огноо</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-[#9CA3AF] text-sm">Хэрэглэгч олдсонгүй</td></tr>
                ) : (
                  filtered.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => { setSelectedLead(lead); setNoteText('') }}
                      className={`border-b border-[#F3F4F6] hover:bg-[#F7FAFF] cursor-pointer transition-colors ${selectedLead?.id === lead.id ? 'bg-[#EAF3FF]' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-[#1F2937]">{lead.full_name}</td>
                      <td className="px-4 py-3 text-[#6B7280]">
                        <a
                          href={`tel:${lead.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 hover:text-[#1E63B5]"
                        >
                          <Phone size={12} /> {lead.phone}
                        </a>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {lead.risk_level && (
                          <Badge color={riskColors[lead.risk_level]}>{riskLabels[lead.risk_level]}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge color={statusColors[lead.status]}>{statusLabels[lead.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#9CA3AF] hidden lg:table-cell">
                        {new Date(lead.created_at).toLocaleDateString('mn-MN')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedLead(lead) }}
                          className="text-[#1E63B5] text-xs hover:underline"
                        >
                          Дэлгэрэнгүй
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        {selectedLead && (
          <div className="lg:w-80 bg-white rounded-2xl border border-[#E5E7EB] p-5 h-fit sticky top-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-black text-[#1F2937]">{selectedLead.full_name}</h3>
                <a href={`tel:${selectedLead.phone}`} className="text-sm text-[#1E63B5] flex items-center gap-1 mt-0.5">
                  <Phone size={12} /> {selectedLead.phone}
                </a>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-[#9CA3AF] hover:text-[#1F2937] text-xl leading-none">×</button>
            </div>

            {/* Risk */}
            {selectedLead.risk_level && (
              <div className="mb-4">
                <div className="text-xs text-[#6B7280] mb-1">Эрсдэлийн түвшин</div>
                <Badge color={riskColors[selectedLead.risk_level]} className="text-sm px-3 py-1">
                  {riskLabels[selectedLead.risk_level]}
                </Badge>
              </div>
            )}

            {/* Categories */}
            {selectedLead.categories_selected && (
              <div className="mb-4">
                <div className="text-xs text-[#6B7280] mb-1">Шинжилгээний хэсэг</div>
                <div className="flex flex-wrap gap-1">
                  {selectedLead.categories_selected.map((c) => (
                    <span key={c} className="bg-[#EAF3FF] text-[#1E63B5] text-xs px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Status change */}
            <div className="mb-4">
              <div className="text-xs text-[#6B7280] mb-1">Статус өөрчлөх</div>
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.keys(statusLabels) as LeadStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selectedLead.id, s)}
                    className={[
                      'py-1.5 rounded-lg text-xs font-semibold border transition-all',
                      selectedLead.status === s
                        ? 'bg-[#1E63B5] text-white border-[#1E63B5]'
                        : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:border-[#1E63B5]',
                    ].join(' ')}
                  >
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-4">
              <a
                href={`/appointment?name=${encodeURIComponent(selectedLead.full_name)}&phone=${encodeURIComponent(selectedLead.phone)}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#EAF3FF] text-[#1E63B5] rounded-xl text-xs font-semibold hover:bg-[#d3e8ff]"
              >
                <Calendar size={13} /> Цаг захиалах
              </a>
              <a
                href={`/consultation?name=${encodeURIComponent(selectedLead.full_name)}&phone=${encodeURIComponent(selectedLead.phone)}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#DCFCE7] text-[#16A34A] rounded-xl text-xs font-semibold hover:bg-[#bbf7d0]"
              >
                <MessageSquare size={13} /> Зөвлөгөө
              </a>
            </div>

            {/* Notes */}
            <div>
              <div className="text-xs text-[#6B7280] mb-1 flex items-center gap-1">
                <StickyNote size={12} /> Тэмдэглэл
              </div>
              {selectedLead.notes && (
                <div className="bg-[#FEF9C3] rounded-xl px-3 py-2 text-xs text-[#92400E] mb-2 whitespace-pre-wrap">
                  {selectedLead.notes}
                </div>
              )}
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={2}
                placeholder="Тэмдэглэл нэмэх..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#1E63B5] resize-none mb-2"
              />
              <Button size="sm" fullWidth loading={loading} onClick={addNote} disabled={!noteText.trim()}>
                Хадгалах
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
