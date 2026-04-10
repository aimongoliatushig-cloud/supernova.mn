import { CalendarDays, Clock3, Phone, Stethoscope, UserRound } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import type { UnifiedCalendarAppointment } from '@/lib/admin/types'

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

function formatDayLabel(date: string) {
  return new Intl.DateTimeFormat('mn-MN', {
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

function buildNextSevenDays() {
  const dates: string[] = []
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  for (let index = 0; index < 7; index += 1) {
    const value = new Date(cursor)
    value.setDate(cursor.getDate() + index)
    dates.push(toDateKey(value))
  }

  return dates
}

export default function UnifiedCalendarBoard({
  appointments,
}: {
  appointments: UnifiedCalendarAppointment[]
}) {
  const days = buildNextSevenDays()
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
            Нэгдсэн календарь
          </p>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-[#10233B]">
            Reception ба CRM-д харагдах 7 хоногийн цагийн хуваарь
          </h2>
          <p className="mt-3 text-sm leading-7 text-[#5B6877]">
            Бүх эмч, үйлчилгээний цаг захиалгыг нэг дороос өдөр, цагаар нь харж давхардал,
            баталгаажуулалт, follow-up-ийг хянах зориулалттай.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#E5EDF7] bg-[#FBFDFF] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A98A8]">
              7 хоногт
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
                    ? `${dayAppointments.length} захиалга`
                    : 'Захиалгагүй өдөр'}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {dayAppointments.length > 0 ? (
                  dayAppointments.map((appointment) => (
                    <article
                      key={appointment.id}
                      className="rounded-2xl border border-[#E7EEF8] bg-white p-3 shadow-sm"
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
                          <span>{appointment.leads?.full_name ?? 'Нэргүй захиалга'}</span>
                        </p>
                        <p className="flex items-start gap-2 text-xs leading-6 text-[#5B6877]">
                          <Stethoscope size={13} className="mt-1 shrink-0 text-[#7B8A99]" />
                          <span>
                            {appointment.services?.name ?? 'Үйлчилгээ сонгоогүй'}
                            {appointment.doctors?.full_name
                              ? ` · ${appointment.doctors.full_name}`
                              : ''}
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
                    Цаг захиалга алга
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
