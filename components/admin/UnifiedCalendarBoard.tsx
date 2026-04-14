'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CalendarDays,
  Clock3,
  Phone,
  Plus,
  Save,
  Stethoscope,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import {
  AdminInput,
  AdminMessage,
  AdminSelect,
} from '@/components/admin/AdminPrimitives'
import { buildDateRange, formatCalendarDayLabel } from '@/lib/admin/date-format'
import type { UnifiedCalendarAppointment } from '@/lib/admin/types'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
  createAppointmentFromCalendarForStaff,
  deleteAppointmentForStaff,
  updateAppointmentForStaff,
} from '@/app/dashboard/staff/actions'

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

type CalendarDoctor = {
  id: string
  full_name: string
  specialization: string
}

type CalendarService = {
  id: string
  name: string
}

export default function UnifiedCalendarBoard({
  appointments,
  days,
  doctors = [],
  services = [],
  canCreateAppointments = false,
  canDeleteAppointments = false,
}: {
  appointments: UnifiedCalendarAppointment[]
  days: string[]
  doctors?: CalendarDoctor[]
  services?: CalendarService[]
  canCreateAppointments?: boolean
  canDeleteAppointments?: boolean
}) {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [editingAppointment, setEditingAppointment] = useState<UnifiedCalendarAppointment | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editStatus, setEditStatus] = useState<UnifiedCalendarAppointment['status']>('pending')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [createDate, setCreateDate] = useState<string | null>(null)
  const [createName, setCreateName] = useState('')
  const [createPhone, setCreatePhone] = useState('')
  const [createDoctorId, setCreateDoctorId] = useState('')
  const [createServiceId, setCreateServiceId] = useState('')
  const [createTime, setCreateTime] = useState('09:00')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const actualDays = useMemo(
    () => (days.length > 0 ? buildDateRange(days[0], viewMode === 'week' ? 7 : 30) : []),
    [days, viewMode]
  )
  const upcomingAppointments = useMemo(
    () =>
      appointments.filter((appointment) => actualDays.includes(appointment.appointment_date)),
    [actualDays, appointments]
  )

  const totalUpcoming = upcomingAppointments.length
  const confirmedCount = upcomingAppointments.filter(
    (appointment) => appointment.status === 'confirmed'
  ).length
  const pendingCount = upcomingAppointments.filter(
    (appointment) => appointment.status === 'pending'
  ).length

  function closeEditModal() {
    setEditingAppointment(null)
    setEditError(null)
  }

  function openEditModal(appointment: UnifiedCalendarAppointment) {
    setEditingAppointment(appointment)
    setEditDate(appointment.appointment_date)
    setEditTime(appointment.appointment_time)
    setEditStatus(appointment.status)
    setEditError(null)
  }

  async function handleEditSave() {
    if (!editingAppointment) {
      return
    }

    setIsSaving(true)
    setEditError(null)

    const result = await updateAppointmentForStaff({
      appointment_id: editingAppointment.id,
      appointment_date: editDate,
      appointment_time: editTime,
      status: editStatus,
    })

    setIsSaving(false)

    if (!result.ok) {
      setEditError(result.error ?? 'Алдаа гарлаа.')
      return
    }

    closeEditModal()
    router.refresh()
  }

  async function handleDeleteAppointment() {
    if (!editingAppointment) {
      return
    }

    if (!window.confirm('Энэ appointment-ийг устгах уу?')) {
      return
    }

    setIsDeleting(true)
    setEditError(null)

    const result = await deleteAppointmentForStaff(editingAppointment.id)

    setIsDeleting(false)

    if (!result.ok) {
      setEditError(result.error ?? 'Алдаа гарлаа.')
      return
    }

    closeEditModal()
    router.refresh()
  }

  function openCreateModal(day: string) {
    setCreateDate(day)
    setCreateName('')
    setCreatePhone('')
    setCreateDoctorId('')
    setCreateServiceId('')
    setCreateTime('09:00')
    setCreateError(null)
  }

  function closeCreateModal() {
    setCreateDate(null)
    setCreateError(null)
  }

  async function handleCreateSave() {
    if (!createDate) {
      return
    }

    setIsCreating(true)
    setCreateError(null)

    const result = await createAppointmentFromCalendarForStaff({
      full_name: createName,
      phone: createPhone,
      service_id: createServiceId,
      doctor_id: createDoctorId,
      appointment_date: createDate,
      appointment_time: createTime,
    })

    setIsCreating(false)

    if (!result.ok) {
      setCreateError(result.error ?? 'Алдаа гарлаа.')
      return
    }

    closeCreateModal()
    router.refresh()
  }

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
            Өдөр бүрийн захиалгыг харж, оффисын ажилтан шууд шинэ цаг нэмэх боломжтой.
          </p>
        </div>

        <div className="flex flex-col items-end gap-4">
          <div className="inline-flex rounded-xl bg-[#F3F4F6] p-1">
            <button
              type="button"
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
              type="button"
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

          <div className="grid w-full gap-3 sm:grid-cols-3">
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
        {actualDays.map((day) => {
          const dayAppointments = upcomingAppointments.filter(
            (appointment) => appointment.appointment_date === day
          )

          return (
            <div key={day} className="rounded-[1.5rem] border border-[#E5EDF7] bg-[#FBFDFF] p-4">
              <div className="flex items-start justify-between gap-3 border-b border-[#E6EEF8] pb-3">
                <div>
                  <p className="text-sm font-black text-[#10233B]">{formatCalendarDayLabel(day)}</p>
                  <p className="mt-1 text-xs text-[#7C8A99]">
                    {dayAppointments.length > 0 ? `${dayAppointments.length} захиалга` : 'Цаг алга'}
                  </p>
                </div>

                {canCreateAppointments ? (
                  <button
                    type="button"
                    onClick={() => openCreateModal(day)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#B8D5FB] bg-white text-[#1E63B5] transition hover:bg-[#EAF3FF]"
                    aria-label="Шинэ цаг нэмэх"
                    title="Шинэ цаг нэмэх"
                  >
                    <Plus size={16} />
                  </button>
                ) : null}
              </div>

              <div className="mt-4 space-y-3">
                {dayAppointments.length > 0 ? (
                  dayAppointments.map((appointment) => (
                    <article
                      key={appointment.id}
                      onClick={() => openEditModal(appointment)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openEditModal(appointment)
                        }
                      }}
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

      {editingAppointment ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Цагийн захиалга засах</h3>
                <p className="mt-1 flex items-center gap-2 text-sm text-[#6B7280]">
                  <UserRound size={14} />
                  {editingAppointment.leads?.full_name ?? 'Нэргүй үйлчлүүлэгч'}
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-xl p-2 text-[#9CA3AF] transition hover:bg-[#F3F4F6] hover:text-[#4B5563]"
                aria-label="Хаах"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {editError ? <AdminMessage tone="error">{editError}</AdminMessage> : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#4B5563]">Өдөр</label>
                  <AdminInput type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#4B5563]">Цаг</label>
                  <AdminInput type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#4B5563]">Төлөв</label>
                <AdminSelect
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as UnifiedCalendarAppointment['status'])
                  }
                >
                  {(Object.keys(appointmentLabels) as UnifiedCalendarAppointment['status'][]).map(
                    (status) => (
                      <option key={status} value={status}>
                        {appointmentLabels[status]}
                      </option>
                    )
                  )}
                </AdminSelect>
              </div>

              <div className="mt-6 flex gap-3">
                {canDeleteAppointments ? (
                  <Button
                    variant="danger"
                    onClick={handleDeleteAppointment}
                    className="w-full"
                    disabled={isSaving || isDeleting}
                    loading={isDeleting}
                  >
                    <Trash2 size={16} />
                    Устгах
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={closeEditModal}
                  className="w-full"
                  disabled={isSaving || isDeleting}
                >
                  Болих
                </Button>
                <Button
                  onClick={handleEditSave}
                  className="w-full"
                  disabled={isSaving || isDeleting}
                  loading={isSaving}
                >
                  <Save size={16} />
                  Хадгалах
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {createDate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Шинэ цагийн захиалга</h3>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {formatCalendarDayLabel(createDate)} өдөрт оффисоос шууд цаг нэмнэ.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded-xl p-2 text-[#9CA3AF] transition hover:bg-[#F3F4F6] hover:text-[#4B5563]"
                aria-label="Хаах"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {createError ? <AdminMessage tone="error">{createError}</AdminMessage> : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#4B5563]">Нэр</label>
                  <AdminInput
                    value={createName}
                    onChange={(event) => setCreateName(event.target.value)}
                    placeholder="Үйлчлүүлэгчийн нэр"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#4B5563]">Утас</label>
                  <AdminInput
                    value={createPhone}
                    onChange={(event) => setCreatePhone(event.target.value)}
                    placeholder="Утасны дугаар"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#4B5563]">Үйлчилгээ</label>
                  <AdminSelect
                    value={createServiceId}
                    onChange={(event) => setCreateServiceId(event.target.value)}
                  >
                    <option value="">Үйлчилгээ сонгоно уу</option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </AdminSelect>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#4B5563]">Эмч</label>
                  <AdminSelect
                    value={createDoctorId}
                    onChange={(event) => setCreateDoctorId(event.target.value)}
                  >
                    <option value="">Эмч сонгоно уу</option>
                    {doctors.map((doctor) => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.full_name} · {doctor.specialization}
                      </option>
                    ))}
                  </AdminSelect>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#4B5563]">Өдөр</label>
                  <AdminInput type="date" value={createDate} onChange={(event) => setCreateDate(event.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#4B5563]">Цаг</label>
                  <AdminInput
                    type="time"
                    value={createTime}
                    onChange={(event) => setCreateTime(event.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-[#EAF1F8] bg-[#F7FAFF] px-4 py-3 text-sm text-[#5B6877]">
                Нэг эмчид нэг өдөр, нэг цаг дээр давхар захиалга өгөхгүй. Давхцвал өөр цаг сонгох
                шаардлагатай.
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  onClick={closeCreateModal}
                  className="w-full"
                  disabled={isCreating}
                >
                  Болих
                </Button>
                <Button
                  onClick={handleCreateSave}
                  className="w-full"
                  disabled={isCreating}
                  loading={isCreating}
                >
                  <Save size={16} />
                  Цаг бүртгэх
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
