'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import {
  deleteService,
  deleteServiceCategory,
  saveService,
  saveServiceCategory,
} from '@/app/dashboard/admin/actions'
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
import type {
  Service,
  ServiceCategory,
  ServiceCategoryInput,
  ServiceInput,
} from '@/lib/admin/types'

const blankCategory: ServiceCategoryInput = {
  name: '',
  icon: '🏥',
  sort_order: 0,
  is_active: true,
}

const blankService: ServiceInput = {
  name: '',
  category_id: null,
  description: '',
  price: 0,
  duration_minutes: 30,
  preparation_notice: '',
  promotion_flag: false,
  has_last_booking_time: false,
  last_booking_time: null,
  is_active: true,
  show_on_landing: true,
  show_on_result: false,
  show_on_booking: true,
  sort_order: 0,
}

function toServiceInput(service?: Service | null): ServiceInput {
  if (!service) {
    return blankService
  }

  return {
    id: service.id,
    name: service.name,
    category_id: service.category_id,
    description: service.description ?? '',
    price: service.price,
    duration_minutes: service.duration_minutes,
    preparation_notice: service.preparation_notice ?? '',
    promotion_flag: service.promotion_flag,
    has_last_booking_time: Boolean(service.has_last_booking_time),
    last_booking_time: service.last_booking_time ?? null,
    is_active: service.is_active,
    show_on_landing: service.show_on_landing,
    show_on_result: service.show_on_result,
    show_on_booking: service.show_on_booking,
    sort_order: service.sort_order,
  }
}

function toCategoryInput(category?: ServiceCategory | null): ServiceCategoryInput {
  if (!category) {
    return blankCategory
  }

  return {
    id: category.id,
    name: category.name,
    icon: category.icon ?? '🏥',
    sort_order: category.sort_order,
    is_active: category.is_active,
  }
}

function formatPrice(price: number) {
  return `${Number(price).toLocaleString('mn-MN')} \u20AE`
}

export default function ServicesManager({
  initialCategories,
  initialServices,
}: {
  initialCategories: ServiceCategory[]
  initialServices: Service[]
}) {
  const { pending, error, success, runAction } = useServerAction()
  const [categories, setCategories] = useState(initialCategories)
  const [categoryDraft, setCategoryDraft] = useState<ServiceCategoryInput>(blankCategory)
  const [services, setServices] = useState(initialServices)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    initialServices[0]?.id ?? null
  )
  const [serviceForm, setServiceForm] = useState<ServiceInput>(
    toServiceInput(initialServices[0] ?? null)
  )
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  useEffect(() => {
    setServices(initialServices)
  }, [initialServices])

  useEffect(() => {
    if (!selectedServiceId) {
      return
    }

    const selected = services.find((service) => service.id === selectedServiceId) ?? services[0]

    setSelectedServiceId(selected?.id ?? null)
    setServiceForm(toServiceInput(selected ?? null))
  }, [selectedServiceId, services])

  const categoryLookup = useMemo(
    () => Object.fromEntries(categories.map((category) => [category.id, category])),
    [categories]
  )

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch = service.name.toLowerCase().includes(search.trim().toLowerCase())
      const matchesCategory =
        categoryFilter === 'all' ? true : service.category_id === categoryFilter
      return matchesSearch && matchesCategory
    })
  }, [categoryFilter, search, services])

  function openService(service?: Service) {
    setSelectedServiceId(service?.id ?? null)
    setServiceForm(toServiceInput(service ?? null))
  }

  function openCategory(category?: ServiceCategory) {
    setCategoryDraft(toCategoryInput(category ?? null))
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <AdminPageHeader
        eyebrow="Үйлчилгээ"
        title="Үйлчилгээ, ангилал, харагдац"
        description="Үйлчилгээний бүртгэл, ангилал болон нүүр, үр дүн, цаг захиалгын хуудсан дээрх харагдацыг эндээс удирдана."
      />

      {error ? <AdminMessage tone="error">{error}</AdminMessage> : null}
      {success ? <AdminMessage tone="success">{success}</AdminMessage> : null}

      <div className="grid gap-6 2xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <AdminSectionCard
            title="Үйлчилгээний ангилал"
            description="Ангилал нь зөвхөн бүлэглэх зориулалттай. Эмчтэй холбох тохиргоог Эмч нарын хуудаснаас удирдана."
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label="Ангиллын нэр" required>
                  <AdminInput
                    value={categoryDraft.name}
                    onChange={(event) =>
                      setCategoryDraft((current) => ({ ...current, name: event.target.value }))
                    }
                  />
                </AdminField>
                <AdminField label="Тэмдэгт">
                  <AdminInput
                    value={categoryDraft.icon}
                    onChange={(event) =>
                      setCategoryDraft((current) => ({ ...current, icon: event.target.value }))
                    }
                  />
                </AdminField>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <AdminField label="Эрэмбэ">
                  <AdminInput
                    type="number"
                    value={categoryDraft.sort_order}
                    onChange={(event) =>
                      setCategoryDraft((current) => ({
                        ...current,
                        sort_order: Number(event.target.value),
                      }))
                    }
                  />
                </AdminField>
                <div className="flex items-end">
                  <AdminToggle
                    label="Идэвхтэй"
                    active={categoryDraft.is_active}
                    onClick={() =>
                      setCategoryDraft((current) => ({
                        ...current,
                        is_active: !current.is_active,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    runAction(
                      async () => {
                        const result = await saveServiceCategory(categoryDraft)
                        if (result.ok) {
                          setCategoryDraft(blankCategory)
                        }
                        return result
                      },
                      { successMessage: 'Ангилал хадгалагдлаа.' }
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#154D8F]"
                >
                  <Plus size={14} />
                  Ангилал нэмэх
                </button>
                {categoryDraft.id ? (
                  <button
                    type="button"
                    onClick={() => openCategory()}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#D8E6F6] bg-[#F7FAFF] px-4 py-3 text-sm font-semibold text-[#1E63B5]"
                  >
                    <Plus size={14} />
                    Шинэ ангилал
                  </button>
                ) : null}
              </div>

              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex flex-col gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-[#1F2937]">
                          {category.icon ?? '🏥'} {category.name}
                        </p>
                        <p className="text-sm text-[#6B7280]">Эрэмбэ: {category.sort_order}</p>
                      </div>
                      <AdminToggle
                        label="Идэвхтэй"
                        active={category.is_active}
                        onClick={() =>
                          runAction(() =>
                            saveServiceCategory({
                              id: category.id,
                              name: category.name,
                              icon: category.icon ?? '🏥',
                              sort_order: category.sort_order,
                              is_active: !category.is_active,
                            })
                          )
                        }
                      />
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => openCategory(category)}
                        className="text-xs font-semibold text-[#1E63B5]"
                      >
                        Засах
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={pending}
                    onClick={() => {
                        if (!window.confirm('Энэ ангиллыг устгах уу?')) {
                          return
                        }

                        runAction(() => deleteServiceCategory(category.id), {
                          successMessage: 'Ангилал устгагдлаа.',
                        })
                      }}
                      className="inline-flex items-center gap-2 self-start rounded-xl border border-[#F7D5D9] bg-[#FFF1F2] px-4 py-2.5 text-sm font-semibold text-[#F23645]"
                    >
                      <Trash2 size={14} />
                      Устгах
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </AdminSectionCard>

          <AdminSectionCard
            title={selectedServiceId ? 'Үйлчилгээ засах' : 'Шинэ үйлчилгээ'}
            description="Олон нийтэд харагдах сайт, цаг захиалга, үр дүнгийн хуудсанд ашиглах үндсэн үйлчилгээний мэдээлэл."
            action={
              <button
                type="button"
                onClick={() => openService()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#154D8F]"
              >
                <Plus size={14} />
                Шинэ үйлчилгээ
              </button>
            }
          >
            <div className="space-y-4">
              <AdminField label="Үйлчилгээний нэр" required>
                <AdminInput
                  value={serviceForm.name}
                  onChange={(event) =>
                    setServiceForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </AdminField>

              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="Ангилал">
                  <AdminSelect
                    value={serviceForm.category_id ?? ''}
                    onChange={(event) =>
                      setServiceForm((current) => ({
                        ...current,
                        category_id: event.target.value || null,
                      }))
                    }
                  >
                    <option value="">Ангилал сонгох</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon ?? '🏥'} {category.name}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Эрэмбэ">
                  <AdminInput
                    type="number"
                    value={serviceForm.sort_order}
                    onChange={(event) =>
                      setServiceForm((current) => ({
                        ...current,
                        sort_order: Number(event.target.value),
                      }))
                    }
                  />
                </AdminField>
              </div>

              <AdminField label="Тайлбар">
                <AdminTextArea
                  rows={4}
                  value={serviceForm.description}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </AdminField>

              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="Үнэ">
                  <AdminInput
                    type="number"
                    min={0}
                    value={serviceForm.price}
                    onChange={(event) =>
                      setServiceForm((current) => ({
                        ...current,
                        price: Number(event.target.value),
                      }))
                    }
                  />
                </AdminField>
                <AdminField label="Үргэлжлэх хугацаа (минут)">
                  <AdminInput
                    type="number"
                    min={1}
                    value={serviceForm.duration_minutes}
                    onChange={(event) =>
                      setServiceForm((current) => ({
                        ...current,
                        duration_minutes: Number(event.target.value),
                      }))
                    }
                  />
                </AdminField>
              </div>

              <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                <div className="flex items-end">
                  <AdminToggle
                    label="Сүүлийн захиалга авах цаг хязгаарлах"
                    active={serviceForm.has_last_booking_time}
                    onClick={() =>
                      setServiceForm((current) => ({
                        ...current,
                        has_last_booking_time: !current.has_last_booking_time,
                        last_booking_time: current.has_last_booking_time
                          ? null
                          : current.last_booking_time ?? '16:00',
                      }))
                    }
                  />
                </div>
                <AdminField
                  label="Сүүлийн захиалга авах цаг"
                  hint="Идэвхжүүлбэл энэ үйлчилгээг ажлын эхлэх цагаас эхлээд энэ цаг хүртэл захиалах боломжтой байна."
                >
                  <AdminInput
                    type="time"
                    value={serviceForm.last_booking_time ?? ''}
                    disabled={!serviceForm.has_last_booking_time}
                    onChange={(event) =>
                      setServiceForm((current) => ({
                        ...current,
                        last_booking_time: event.target.value || null,
                      }))
                    }
                  />
                </AdminField>
              </div>

              <AdminField label="Бэлтгэл заавар">
                <AdminTextArea
                  rows={3}
                  value={serviceForm.preparation_notice}
                  onChange={(event) =>
                    setServiceForm((current) => ({
                      ...current,
                      preparation_notice: event.target.value,
                    }))
                  }
                />
              </AdminField>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#1F2937]">Харагдац</p>
                <div className="flex flex-wrap gap-2">
                  <AdminToggle
                    label="Идэвхтэй"
                    active={serviceForm.is_active}
                    onClick={() =>
                      setServiceForm((current) => ({
                        ...current,
                        is_active: !current.is_active,
                      }))
                    }
                  />
                  <AdminToggle
                    label="Нүүрэнд харуулах"
                    active={serviceForm.show_on_landing}
                    onClick={() =>
                      setServiceForm((current) => ({
                        ...current,
                        show_on_landing: !current.show_on_landing,
                      }))
                    }
                  />
                  <AdminToggle
                    label="Үр дүнд харуулах"
                    active={serviceForm.show_on_result}
                    onClick={() =>
                      setServiceForm((current) => ({
                        ...current,
                        show_on_result: !current.show_on_result,
                      }))
                    }
                  />
                  <AdminToggle
                    label="Цаг захиалгад харуулах"
                    active={serviceForm.show_on_booking}
                    onClick={() =>
                      setServiceForm((current) => ({
                        ...current,
                        show_on_booking: !current.show_on_booking,
                      }))
                    }
                  />
                  <AdminToggle
                    label="Урамшуулалтай гэж онцлох"
                    active={serviceForm.promotion_flag}
                    onClick={() =>
                      setServiceForm((current) => ({
                        ...current,
                        promotion_flag: !current.promotion_flag,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    runAction(() => saveService(serviceForm), {
                      successMessage: selectedServiceId
                        ? 'Үйлчилгээ шинэчлэгдлээ.'
                        : 'Үйлчилгээ нэмэгдлээ.',
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-semibold text-white"
                >
                  <Save size={16} />
                  Хадгалах
                </button>

                {selectedServiceId ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (!window.confirm('Энэ үйлчилгээг устгах уу?')) {
                        return
                      }

                      runAction(() => deleteService(selectedServiceId), {
                        successMessage: 'Үйлчилгээ устгагдлаа.',
                      })
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
        </div>

        <AdminSectionCard
          title="Үйлчилгээний жагсаалт"
          description="Ангиллаар шүүж, нүүр, үр дүн, цаг захиалгын харагдацыг эндээс тохируулна."
        >
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_0.55fr]">
              <AdminInput
                placeholder="Үйлчилгээ хайх"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <AdminSelect
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="all">Бүх ангилал</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon ?? '🏥'} {category.name}
                  </option>
                ))}
              </AdminSelect>
            </div>

            {filteredServices.length === 0 ? (
              <AdminEmptyState
                title="Үйлчилгээ олдсонгүй"
                description="Шүүлтээ өөрчлөх эсвэл шинэ үйлчилгээ нэмнэ үү."
                actionLabel="Шинэ үйлчилгээ"
                onAction={() => openService()}
              />
            ) : (
              <div className="space-y-3">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className={[
                      'rounded-2xl border p-4 transition',
                      selectedServiceId === service.id
                        ? 'border-[#B8D5FB] bg-[#F7FAFF]'
                        : 'border-[#E5E7EB] bg-white',
                    ].join(' ')}
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <button type="button" onClick={() => openService(service)} className="text-left">
                        <p className="text-base font-bold text-[#1F2937]">{service.name}</p>
                        <p className="text-sm text-[#6B7280]">
                          {categoryLookup[service.category_id ?? '']?.name ?? 'Ангилагдаагүй'} ·{' '}
                          {service.duration_minutes} мин
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#1E63B5]">
                          {formatPrice(service.price)}
                        </p>
                        {service.has_last_booking_time && service.last_booking_time ? (
                          <p className="mt-1 text-xs font-semibold text-[#D97706]">
                            Сүүлийн захиалга авах цаг: {service.last_booking_time.slice(0, 5)}
                          </p>
                        ) : null}
                      </button>

                      <div className="flex flex-wrap gap-2">
                        <AdminToggle
                          label="Нүүр"
                          active={service.show_on_landing}
                          onClick={() =>
                            runAction(() =>
                              saveService({
                                ...toServiceInput(service),
                                show_on_landing: !service.show_on_landing,
                              })
                            )
                          }
                        />
                        <AdminToggle
                          label="Үр дүн"
                          active={service.show_on_result}
                          onClick={() =>
                            runAction(() =>
                              saveService({
                                ...toServiceInput(service),
                                show_on_result: !service.show_on_result,
                              })
                            )
                          }
                        />
                        <AdminToggle
                          label="Цаг захиалга"
                          active={service.show_on_booking}
                          onClick={() =>
                            runAction(() =>
                              saveService({
                                ...toServiceInput(service),
                                show_on_booking: !service.show_on_booking,
                              })
                            )
                          }
                        />
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
