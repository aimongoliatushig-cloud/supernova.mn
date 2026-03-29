'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { deletePackage, savePackage } from '@/app/dashboard/admin/actions'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminMessage,
  AdminPageHeader,
  AdminSectionCard,
  AdminTextArea,
  AdminToggle,
} from '@/components/admin/AdminPrimitives'
import { useServerAction } from '@/components/admin/useServerAction'
import type { ServicePackage, ServicePackageInput } from '@/lib/admin/types'

const blankPackage: ServicePackageInput = {
  title: '',
  description: '',
  price: 0,
  old_price: null,
  promotion_text: '',
  badge_text: '',
  badge_color: '#1E63B5',
  is_active: true,
  show_on_landing: true,
  show_on_result: false,
  sort_order: 0,
  service_ids: [],
}

function toPackageInput(pkg?: ServicePackage | null): ServicePackageInput {
  if (!pkg) {
    return blankPackage
  }

  return {
    id: pkg.id,
    title: pkg.title,
    description: pkg.description ?? '',
    price: pkg.price,
    old_price: pkg.old_price,
    promotion_text: pkg.promotion_text ?? '',
    badge_text: pkg.badge_text ?? '',
    badge_color: pkg.badge_color,
    is_active: pkg.is_active,
    show_on_landing: pkg.show_on_landing,
    show_on_result: pkg.show_on_result,
    sort_order: pkg.sort_order,
    service_ids: pkg.package_services?.map((relation) => relation.service_id) ?? [],
  }
}

export default function PackagesManager({
  initialPackages,
  services,
}: {
  initialPackages: ServicePackage[]
  services: Array<{ id: string; name: string; price: number }>
}) {
  const { pending, error, success, runAction } = useServerAction()
  const [packages, setPackages] = useState(initialPackages)
  const [search, setSearch] = useState('')
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(
    initialPackages[0]?.id ?? null
  )
  const [form, setForm] = useState<ServicePackageInput>(toPackageInput(initialPackages[0] ?? null))

  useEffect(() => {
    setPackages(initialPackages)
    const selected =
      initialPackages.find((item) => item.id === selectedPackageId) ?? initialPackages[0]
    setSelectedPackageId(selected?.id ?? null)
    setForm(toPackageInput(selected ?? null))
  }, [initialPackages, selectedPackageId])

  const filteredPackages = useMemo(() => {
    return packages.filter((item) =>
      item.title.toLowerCase().includes(search.trim().toLowerCase())
    )
  }, [packages, search])

  const serviceLookup = useMemo(
    () =>
      Object.fromEntries(
        services.map((service) => [service.id, { name: service.name, price: service.price }])
      ),
    [services]
  )

  function openPackage(pkg?: ServicePackage) {
    setSelectedPackageId(pkg?.id ?? null)
    setForm(toPackageInput(pkg ?? null))
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
        eyebrow="Packages"
        title="Багц ба багц-үйлчилгээний холбоос"
        description="Нүүр хуудас болон result page дээр санал болгох багц үйлчилгээнүүдийг олон үйлчилгээтэй нь хамт удирдана."
      />

      {error ? <AdminMessage tone="error">{error}</AdminMessage> : null}
      {success ? <AdminMessage tone="success">{success}</AdminMessage> : null}

      <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.2fr]">
        <AdminSectionCard
          title={selectedPackageId ? 'Багц засах' : 'Шинэ багц'}
          description="Price anchoring, badge, promotion text болон доторх үйлчилгээний холбоос."
          action={
            <button
              type="button"
              onClick={() => openPackage()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={14} />
              Шинэ багц
            </button>
          }
        >
          <div className="space-y-4">
            <AdminField label="Гарчиг" required>
              <AdminInput
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </AdminField>

            <AdminField label="Тайлбар">
              <AdminTextArea
                rows={4}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </AdminField>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Одоогийн үнэ">
                <AdminInput
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, price: Number(event.target.value) }))
                  }
                />
              </AdminField>
              <AdminField label="Хуучин үнэ">
                <AdminInput
                  type="number"
                  min={0}
                  value={form.old_price ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      old_price: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                />
              </AdminField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Badge текст">
                <AdminInput
                  value={form.badge_text}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, badge_text: event.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Badge өнгө">
                <AdminInput
                  type="color"
                  value={form.badge_color}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, badge_color: event.target.value }))
                  }
                  className="h-12"
                />
              </AdminField>
            </div>

            <AdminField label="Promotion текст">
              <AdminInput
                value={form.promotion_text}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    promotion_text: event.target.value,
                  }))
                }
              />
            </AdminField>

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
              <p className="text-sm font-semibold text-[#1F2937]">Харагдах байдал</p>
              <div className="flex flex-wrap gap-2">
                <AdminToggle
                  label="Идэвхтэй"
                  active={form.is_active}
                  onClick={() =>
                    setForm((current) => ({ ...current, is_active: !current.is_active }))
                  }
                />
                <AdminToggle
                  label="Landing дээр"
                  active={form.show_on_landing}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      show_on_landing: !current.show_on_landing,
                    }))
                  }
                />
                <AdminToggle
                  label="Result дээр"
                  active={form.show_on_result}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      show_on_result: !current.show_on_result,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#1F2937]">Багцад багтах үйлчилгээ</p>
              <div className="max-h-56 space-y-2 overflow-y-auto rounded-2xl border border-[#E5E7EB] p-3">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-[#F7FAFF]"
                  >
                    <div>
                      <p className="text-sm text-[#1F2937]">{service.name}</p>
                      <p className="text-xs text-[#9CA3AF]">
                        {Number(service.price).toLocaleString('mn-MN')}₮
                      </p>
                    </div>
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
                  runAction(() => savePackage(form), {
                    successMessage: selectedPackageId
                      ? 'Багц шинэчлэгдлээ.'
                      : 'Шинэ багц бүртгэгдлээ.',
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-semibold text-white"
              >
                <Save size={16} />
                Хадгалах
              </button>
              {selectedPackageId ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm('Энэ багцыг устгах уу?')) {
                      return
                    }

                    runAction(() => deletePackage(selectedPackageId), {
                      successMessage: 'Багц устгагдлаа.',
                    })
                    openPackage()
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
          title="Багцын жагсаалт"
          description="Хайлтаар шүүж, аль багц landing/result блокуудад харагдахыг хурдан хянана."
        >
          <div className="space-y-4">
            <AdminInput
              placeholder="Багцын нэрээр хайх"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {filteredPackages.length === 0 ? (
              <AdminEmptyState
                title="Багц олдсонгүй"
                description="Шүүлтүүрээ өөрчлөх эсвэл шинэ багц үүсгэнэ үү."
                actionLabel="Шинэ багц"
                onAction={() => openPackage()}
              />
            ) : (
              <div className="space-y-3">
                {filteredPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={[
                      'rounded-2xl border p-4 transition',
                      selectedPackageId === pkg.id
                        ? 'border-[#B8D5FB] bg-[#F7FAFF]'
                        : 'border-[#E5E7EB] bg-white',
                    ].join(' ')}
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <button type="button" onClick={() => openPackage(pkg)} className="text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-bold text-[#1F2937]">{pkg.title}</p>
                          {pkg.badge_text ? (
                            <span
                              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                              style={{ backgroundColor: pkg.badge_color }}
                            >
                              {pkg.badge_text}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-[#6B7280]">{pkg.description}</p>
                        <div className="mt-2 flex items-center gap-3 text-sm">
                          <span className="font-semibold text-[#1E63B5]">
                            {Number(pkg.price).toLocaleString('mn-MN')}₮
                          </span>
                          {pkg.old_price ? (
                            <span className="text-[#9CA3AF] line-through">
                              {Number(pkg.old_price).toLocaleString('mn-MN')}₮
                            </span>
                          ) : null}
                        </div>
                      </button>

                      <div className="flex flex-wrap gap-2">
                        <AdminToggle
                          label="Landing"
                          active={pkg.show_on_landing}
                          onClick={() =>
                            runAction(() =>
                              savePackage({
                                ...toPackageInput(pkg),
                                show_on_landing: !pkg.show_on_landing,
                              })
                            )
                          }
                        />
                        <AdminToggle
                          label="Result"
                          active={pkg.show_on_result}
                          onClick={() =>
                            runAction(() =>
                              savePackage({
                                ...toPackageInput(pkg),
                                show_on_result: !pkg.show_on_result,
                              })
                            )
                          }
                        />
                        <AdminToggle
                          label="Идэвхтэй"
                          active={pkg.is_active}
                          onClick={() =>
                            runAction(() =>
                              savePackage({
                                ...toPackageInput(pkg),
                                is_active: !pkg.is_active,
                              })
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(pkg.package_services ?? []).length > 0 ? (
                        pkg.package_services?.map((relation) => (
                          <span
                            key={relation.service_id}
                            className="rounded-full bg-[#EAF3FF] px-3 py-1 text-xs font-semibold text-[#1E63B5]"
                          >
                            {serviceLookup[relation.service_id]?.name ?? relation.service_id}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-[#9CA3AF]">Холбосон үйлчилгээ алга.</span>
                      )}
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
