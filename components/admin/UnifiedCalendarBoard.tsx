'use client'

import { useState } from 'react'
import { CalendarDays, Clock3, Phone, Stethoscope, UserRound, X, Save } from 'lucide-react'
import { buildDateRange, formatCalendarDayLabel } from '@/lib/admin/date-format'
import type { UnifiedCalendarAppointment } from '@/lib/admin/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { updateAppointmentForStaff } from '@/app/dashboard/staff/actions'

const appointmentLabels: Record<UnifiedCalendarAppointment['status'], string> = {
  pending: 'Хүлээгдэж буй',
  confirmed: 'Баталгаажсан',
  cancelled: 'Цуцлагдсан',
  completed: 'Дууссан',
}

const appointmentColors: Record<
  UnifiedCalendarAppointment['status'],
  'yellow' | 'green' | 'red' | 'blue'
> = {
  pending: 'yellow',
  confirmed: 'green',
  cancelled: 'red',
  completed: 'blue',
}

export default function UnifiedCalendarBoard({
  appointments,
  days,
}: {
  appointments: UnifiedCalendarAppointment[]
  days: string[]
}) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [editingAppointment, setEditingAppointment] = useState<UnifiedCalendarAppointment | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editStatus, setEditStatus] = useState<UnifiedCalendarAppointment['status']>('pending')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleEditClick(appointment: UnifiedCalendarAppointment) {
    setEditingAppointment(appointment)
    setEditDate(appointment.appointment_date)
    setEditTime(appointment.appointment_time)
    setEditStatus(appointment.status)
    setError(null)
  }

  function handleCloseModal() {
    setEditingAppointment(null)
  }

  async function handleSave() {
    if (!editingAppointment) return
    setIsSaving(true)
    setError(null)
    const result = await updateAppointmentForStaff({
      appointment_id: editingAppointment.id,
      appointment_date: editDate,
      appointment_time: editTime,
      status: editStatus,
    })
    setIsSaving(false)
    if (result.ok) {
      setEditingAppointment(null)
    } else {
      setError(result.error ?? 'Алдаа гарлаа.')
    }
  }

  const actualDays = days.length > 0 ? buildDateRange(days[0], viewMode === 'week' ? 7 : 30) : []
  const upcomingAppointments = appointments.filter((appointment) =>
    actualDays.includes(appointment.appointment_date)
  )

  const totalUpcoming = upcomingAppointments.length
  const confirmedCount = upcomingAppointments.filter(
    (appointment) => appointment.status === 'confirmed'
  ).length
  const pendingCount = upcomingAppointments.filter(
    (appointment) => appointment.status === 'pending'
  ).length

  return (
    <section className="rounded-[2rem] border border-[#D8E6F6] bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#EAF3FF] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#1E63B5]">
            <CalendarDays size={14} />
            Нэгдсэн календарь
          </p>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-[#10233B]">
            Ресепшн болон CRM-д зориулсан {viewMode === 'week' ? '7' : '30'} хоногийн цагийн хуваарь
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#5B6877]">
            Удахгүй болох захиалгуудыг өдөр болон цагаар нь хянах.
          </p>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="inline-flex rounded-xl bg-[#F3F4F6] p-1">
            <button
              onClick={() => setViewMode('week')}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-[#10233B] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              7 хоног
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-[#10233B] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              30 хоног
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 w-full">
            <div className="rounded-2xl border border-[#E5EDF7] bg-[#FBFDFF] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A98A8]">
                {viewMode === 'week' ? '7 хоног' : '30 хоног'}
              </p>
              <p className="mt-2 text-2xl font-black text-[#10233B]">{totalUpcoming}</p>
            </div>
            <div className="rounded-2xl border border-[#DFF3E7] bg-[#F6FCF8] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6D8E7B]">Баталгаажсан</p>
              <p className="mt-2 text-2xl font-black text-[#16A34A]">{confirmedCount}</p>
            </div>
            <div className="rounded-2xl border border-[#FCE9B2] bg-[#FFFBEA] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8D7A45]">Хүлээгдэж буй</p>
              <p className="mt-2 text-2xl font-black text-[#D97706]">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-7">
        {actualDays.map((day) => {
          const dayAppointments = upcomingAppointments.filter(
            (appointment) => appointment.appointment_date === day
          )

          return (
            <div key={day} className="rounded-[1.5rem] border border-[#E5EDF7] bg-[#FBFDFF] p-4">
              <div className="border-b border-[#E6EEF8] pb-3">
                <p className="text-sm font-black text-[#10233B]">{formatCalendarDayLabel(day)}</p>
                <p className="mt-1 text-xs text-[#7C8A99]">
                  {dayAppointments.length > 0
                    ? `${dayAppointments.length} захиалга`
                    : 'Цаг алга'}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {dayAppointments.length > 0 ? (
                  dayAppointments.map((appointment) => (
                    <article
                      key={appointment.id}
                      onClick={() => handleEditClick(appointment)}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer rounded-2xl border border-[#E7EEF8] bg-white p-3 shadow-sm transition hover:border-[#1E63B5] focus:border-[#1E63B5] focus:outline-none focus:ring-2 focus:ring-[#D6E6FA]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-bold text-[#1E63B5]">
                          <Clock3 size={12} />
                          {appointment.appointment_time.slice(0, 5)}
                        </div>
                        <Badge color={appointmentColors[appointment.status]}>
                          {appointmentLabels[appointment.status]}
                        </Badge>
                      </div>

                      <div className="mt-3 space-y-2">
                        <p className="flex items-start gap-2 text-sm font-bold leading-6 text-[#10233B]">
                          <UserRound size={14} className="mt-1 shrink-0 text-[#7B8A99]" />
                          <span>{appointment.leads?.full_name ?? 'Нэргүй'}</span>
                        </p>
                        <p className="flex items-start gap-2 text-xs leading-6 text-[#5B6877]">
                          <Stethoscope size={13} className="mt-1 shrink-0 text-[#7B8A99]" />
                          <span>
                            {appointment.services?.name ?? 'Үйлчилгээ сонгоогүй'}
                            {appointment.doctors?.full_name ? ` · ${appointment.doctors.full_name}` : ''}
                          </span>
                        </p>
                        {appointment.leads?.phone ? (
                          <p className="flex items-center gap-2 text-xs text-[#5B6877]">
                            <Phone size={13} className="shrink-0 text-[#7B8A99]" />
                            {appointment.leads.phone}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#D7E3F3] bg-white px-3 py-5 text-center text-xs leading-6 text-[#8A98A8]">
                    Энэ өдөр захиалга алга
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {editingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Цаг засах (CRM)</h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-[#6B7280]">
                  <UserRound size={14} />
                  {editingAppointment.leads?.full_name ?? 'Нэргүй өвчтөн'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="rounded-xl p-2 text-[#9CA3AF] transition hover:bg-[#F3F4F6] hover:text-[#4B5563]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#4B5563]">Өдөр</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#4B5563]">Цаг</label>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#4B5563]">Төлөв</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as UnifiedCalendarAppointment['status'])}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                >
                  {(Object.keys(appointmentLabels) as UnifiedCalendarAppointment['status'][]).map((status) => (
                    <option key={status} value={status}>
                      {appointmentLabels[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  className="w-full"
                  disabled={isSaving}
                >
                  Цуцлах
                </Button>
                <Button
                  onClick={handleSave}
                  className="w-full"
                  disabled={isSaving}
                  loading={isSaving}
                >
                  <Save size={16} />
                  Хадгалах
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
