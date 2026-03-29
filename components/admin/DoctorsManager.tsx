'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { deleteDoctor, saveDoctor } from '@/app/dashboard/admin/actions'
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
import type { Doctor, DoctorInput } from '@/lib/admin/types'

const blankDoctor: DoctorInput = {
  full_name: '',
  title: 'Эмч',
  specialization: '',
  experience_years: 0,
  bio: '',
  photo_url: '',
  schedule_summary: '',
  is_active: true,
  show_on_landing: true,
  available_for_booking: true,
  sort_order: 0,
  service_ids: [],
}

function toDoctorInput(doctor?: Doctor | null): DoctorInput {
  if (!doctor) {
    return blankDoctor
  }

  return {
    id: doctor.id,
    full_name: doctor.full_name,
    title: doctor.title,
    specialization: doctor.specialization,
    experience_years: doctor.experience_years,
    bio: doctor.bio ?? '',
    photo_url: doctor.photo_url ?? '',
    schedule_summary: doctor.schedule_summary ?? '',
    is_active: doctor.is_active,
    show_on_landing: doctor.show_on_landing,
    available_for_booking: doctor.available_for_booking,
    sort_order: doctor.sort_order,
    service_ids: doctor.doctor_services?.map((relation) => relation.service_id) ?? [],
  }
}

export default function DoctorsManager({
  initialDoctors,
  services,
}: {
  initialDoctors: Doctor[]
  services: Array<{ id: string; name: string }>
}) {
  const { pending, error, success, runAction } = useServerAction()
  const [doctors, setDoctors] = useState(initialDoctors)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(initialDoctors[0]?.id ?? null)
  const [form, setForm] = useState<DoctorInput>(toDoctorInput(initialDoctors[0] ?? null))

  useEffect(() => {
    setDoctors(initialDoctors)
    const selected = initialDoctors.find((doctor) => doctor.id === selectedId) ?? initialDoctors[0]
    setSelectedId(selected?.id ?? null)
    setForm(toDoctorInput(selected ?? null))
  }, [initialDoctors, selectedId])

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const query = search.trim().toLowerCase()
      if (!query) return true

      return (
        doctor.full_name.toLowerCase().includes(query) ||
        doctor.specialization.toLowerCase().includes(query)
      )
    })
  }, [doctors, search])

  const serviceLookup = useMemo(
    () => Object.fromEntries(services.map((service) => [service.id, service.name])),
    [services]
  )

  function openDoctor(doctor?: Doctor) {
    setSelectedId(doctor?.id ?? null)
    setForm(toDoctorInput(doctor ?? null))
  }

  function toggleService(service_id: string) {
    setForm((current) => ({
      ...current,
      service_ids: current.service_ids.includes(service_id)
        ? current.service_ids.filter((id) => id !== service_id)
        : [...current.service_ids, service_id],
    }))
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <AdminPageHeader
        eyebrow="Doctors"
        title="Эмчийн бүртгэл ба booking холбоос"
        description="Эмчийн профайл, нүүр хуудасны харагдац, цаг авах тохиргоо болон эмч-үйлчилгээний хамаарлыг эндээс удирдана."
      />

      {error ? <AdminMessage tone="error">{error}</AdminMessage> : null}
      {success ? <AdminMessage tone="success">{success}</AdminMessage> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.2fr]">
        <AdminSectionCard
          title={selectedId ? 'Эмч засах' : 'Шинэ эмч нэмэх'}
          description="Booking урсгалд ашиглагдах профайл ба үйлчилгээнүүд."
          action={
            <button
              type="button"
              onClick={() => openDoctor()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#154D8F]"
            >
              <Plus size={14} />
              Шинэ эмч
            </button>
          }
        >
          <div className="space-y-4">
            <AdminField label="Бүтэн нэр" required>
              <AdminInput
                value={form.full_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, full_name: event.target.value }))
                }
              />
            </AdminField>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Цол">
                <AdminSelect
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                >
                  <option value="Эмч">Эмч</option>
                  <option value="Ахлах эмч">Ахлах эмч</option>
                  <option value="Профессор">Профессор</option>
                  <option value="PhD">PhD</option>
                </AdminSelect>
              </AdminField>

              <AdminField label="Туршлага (жил)">
                <AdminInput
                  type="number"
                  min={0}
                  value={form.experience_years}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      experience_years: Number(event.target.value),
                    }))
                  }
                />
              </AdminField>
            </div>

            <AdminField label="Мэргэшил" required>
              <AdminInput
                value={form.specialization}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    specialization: event.target.value,
                  }))
                }
              />
            </AdminField>

            <AdminField label="Товч танилцуулга">
              <AdminTextArea
                rows={4}
                value={form.bio}
                onChange={(event) =>
                  setForm((current) => ({ ...current, bio: event.target.value }))
                }
              />
            </AdminField>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Зургийн URL">
                <AdminInput
                  value={form.photo_url}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, photo_url: event.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Ажиллах хуваарь">
                <AdminInput
                  value={form.schedule_summary}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      schedule_summary: event.target.value,
                    }))
                  }
                />
              </AdminField>
            </div>

            <AdminField label="Дараалал">
              <AdminInput
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    sort_order: Number(event.target.value),
                  }))
                }
              />
            </AdminField>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-[#1F2937]">Төлөвүүд</p>
              <div className="flex flex-wrap gap-2">
                <AdminToggle
                  label="Идэвхтэй"
                  active={form.is_active}
                  onClick={() =>
                    setForm((current) => ({ ...current, is_active: !current.is_active }))
                  }
                />
                <AdminToggle
                  label="Landing дээр харагдана"
                  active={form.show_on_landing}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      show_on_landing: !current.show_on_landing,
                    }))
                  }
                />
                <AdminToggle
                  label="Цаг авах боломжтой"
                  active={form.available_for_booking}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      available_for_booking: !current.available_for_booking,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#1F2937]">Холбоотой үйлчилгээ</p>
              <div className="max-h-52 space-y-2 overflow-y-auto rounded-2xl border border-[#E5E7EB] p-3">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-[#F7FAFF]"
                  >
                    <span className="text-sm text-[#1F2937]">{service.name}</span>
                    <input
                      type="checkbox"
                      checked={form.service_ids.includes(service.id)}
                      onChange={() => toggleService(service.id)}
                      className="h-4 w-4 rounded border-[#CBD5E1] text-[#1E63B5] focus:ring-[#1E63B5]"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  runAction(() => saveDoctor(form), {
                    successMessage: selectedId
                      ? 'Эмчийн мэдээлэл шинэчлэгдлээ.'
                      : 'Шинэ эмч бүртгэгдлээ.',
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#154D8F] disabled:opacity-60"
              >
                <Save size={16} />
                Хадгалах
              </button>

              {selectedId ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm('Энэ эмчийн бүртгэлийг устгах уу?')) {
                      return
                    }

                    runAction(() => deleteDoctor(selectedId), {
                      successMessage: 'Эмчийн бүртгэл устгагдлаа.',
                    })
                    openDoctor()
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#F7D5D9] bg-[#FFF1F2] px-4 py-3 text-sm font-semibold text-[#F23645]"
                >
                  <Trash2 size={16} />
                  Устгах
                </button>
              ) : null}
            </div>
          </div>
        </AdminSectionCard>

        <AdminSectionCard
          title="Эмчийн жагсаалт"
          description="Хайлтаар шүүж, эмч бүрийн харагдац болон үйлчилгээний холбоосыг шалгана."
        >
          <div className="space-y-4">
            <AdminInput
              placeholder="Нэр эсвэл мэргэшлээр хайх"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {filteredDoctors.length === 0 ? (
              <AdminEmptyState
                title="Эмч олдсонгүй"
                description="Хайлтын нөхцөлөө өөрчлөх эсвэл шинэ эмч нэмнэ үү."
                actionLabel="Шинэ эмч үүсгэх"
                onAction={() => openDoctor()}
              />
            ) : (
              <div className="space-y-3">
                {filteredDoctors.map((doctor) => (
                  <div
                    key={doctor.id}
                    className={[
                      'rounded-2xl border p-4 transition',
                      selectedId === doctor.id
                        ? 'border-[#B8D5FB] bg-[#F7FAFF]'
                        : 'border-[#E5E7EB] bg-white',
                    ].join(' ')}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => openDoctor(doctor)}
                          className="text-left"
                        >
                          <p className="text-base font-bold text-[#1F2937]">{doctor.full_name}</p>
                          <p className="text-sm text-[#6B7280]">
                            {doctor.title} · {doctor.specialization} · {doctor.experience_years} жил
                          </p>
                        </button>
                        <div className="flex flex-wrap gap-2">
                          <AdminToggle
                            label="Идэвхтэй"
                            active={doctor.is_active}
                            onClick={() =>
                              runAction(() => saveDoctor({
                                ...toDoctorInput(doctor),
                                is_active: !doctor.is_active,
                              }))
                            }
                          />
                          <AdminToggle
                            label="Landing"
                            active={doctor.show_on_landing}
                            onClick={() =>
                              runAction(() =>
                                saveDoctor({
                                  ...toDoctorInput(doctor),
                                  show_on_landing: !doctor.show_on_landing,
                                })
                              )
                            }
                          />
                          <AdminToggle
                            label="Booking"
                            active={doctor.available_for_booking}
                            onClick={() =>
                              runAction(() =>
                                saveDoctor({
                                  ...toDoctorInput(doctor),
                                  available_for_booking: !doctor.available_for_booking,
                                })
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="max-w-md space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF]">
                          Холбоотой үйлчилгээ
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(doctor.doctor_services ?? []).length > 0 ? (
                            doctor.doctor_services?.map((relation) => (
                              <span
                                key={relation.service_id}
                                className="rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-semibold text-[#1E63B5]"
                              >
                                {serviceLookup[relation.service_id] ?? relation.service_id}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-[#9CA3AF]">Холбосон үйлчилгээ алга.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AdminSectionCard>
      </div>
    </div>
  )
}
