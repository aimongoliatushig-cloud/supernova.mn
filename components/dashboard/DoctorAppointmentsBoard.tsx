'use client'

import { useState } from 'react'
import { CalendarDays, Clock3, Phone, Stethoscope, UserRound, X, Save } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { updateAppointmentForDoctor } from '@/app/dashboard/doctor/actions'

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed'

export interface DoctorAppointment {
  id: string
  appointment_date: string
  appointment_time: string
  status: AppointmentStatus
  leads?: {
    full_name: string | null
    phone: string | null
  } | null
  services?: {
    name: string | null
  } | null
}

const appointmentLabels: Record<AppointmentStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

const appointmentColors: Record<AppointmentStatus, 'yellow' | 'green' | 'red' | 'blue'> = {
  pending: 'yellow',
  confirmed: 'green',
  cancelled: 'red',
  completed: 'blue',
}

function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${date}T00:00:00`))
}

function toDateKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function buildNextDays(count: number) {
  const dates: string[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  for (let index = 0; index < count; index += 1) {
    const value = new Date(cursor)
    value.setDate(cursor.getDate() + index)
    dates.push(toDateKey(value))
  }

  return dates
}

export default function DoctorAppointmentsBoard({
  appointments,
}: {
  appointments: DoctorAppointment[]
}) {
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [editingAppointment, setEditingAppointment] = useState<DoctorAppointment | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editStatus, setEditStatus] = useState<AppointmentStatus>('pending')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleEditClick(appointment: DoctorAppointment) {
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
    const result = await updateAppointmentForDoctor({
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

  const days = buildNextDays(viewMode === 'week' ? 7 : 30)
  const upcomingAppointments = appointments.filter((appointment) =>
    days.includes(appointment.appointment_date)
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
            Цагийн хуваарь
          </p>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-[#10233B]">
            {viewMode === 'week' ? 'Миний ирэх 7 хоног' : 'Миний ирэх 30 хоног'}
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#5B6877]">
            Энэ эмчид хуваарилагдсан цагуудыг өдрөөр бүлэглэсэн тул самбараас гаралгүйгээр хуваариа харах боломжтой.
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
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6D8E7B]">
                Баталгаажсан
              </p>
              <p className="mt-2 text-2xl font-black text-[#16A34A]">{confirmedCount}</p>
            </div>
            <div className="rounded-2xl border border-[#FCE9B2] bg-[#FFFBEA] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8D7A45]">
                Хүлээгдэж буй
              </p>
              <p className="mt-2 text-2xl font-black text-[#D97706]">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-7">
        {days.map((day) => {
          const dayAppointments = upcomingAppointments.filter(
            (appointment) => appointment.appointment_date === day
          )

          return (
            <div
              key={day}
              className="rounded-[1.5rem] border border-[#E5EDF7] bg-[#FBFDFF] p-4"
            >
              <div className="border-b border-[#E6EEF8] pb-3">
                <p className="text-sm font-black text-[#10233B]">{formatDayLabel(day)}</p>
                <p className="mt-1 text-xs text-[#7C8A99]">
                  {dayAppointments.length > 0
                    ? `${dayAppointments.length} booking${dayAppointments.length === 1 ? '' : 's'}`
                    : 'No bookings'}
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
                          <span>{appointment.leads?.full_name ?? 'Unnamed patient'}</span>
                        </p>
                        <p className="flex items-start gap-2 text-xs leading-6 text-[#5B6877]">
                          <Stethoscope size={13} className="mt-1 shrink-0 text-[#7B8A99]" />
                          <span>{appointment.services?.name ?? 'Service not selected'}</span>
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
                    No appointments scheduled.
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
                <h3 className="text-lg font-bold text-[#1F2937]">Цаг засах</h3>
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
                  onChange={(e) => setEditStatus(e.target.value as AppointmentStatus)}
                  className="w-full rounded-xl border border-[#D1D5DB] px-3 py-2.5 text-sm text-[#1F2937] outline-none focus:border-[#1E63B5] focus:ring-2 focus:ring-[#D6E6FA]"
                >
                  {(Object.keys(appointmentLabels) as AppointmentStatus[]).map((status) => (
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
