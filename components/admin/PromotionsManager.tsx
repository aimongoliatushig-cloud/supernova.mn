'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { deletePromotion, savePromotion } from '@/app/dashboard/admin/actions'
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
import type { Promotion, PromotionInput } from '@/lib/admin/types'

const blankPromotion: PromotionInput = {
  title: '',
  description: '',
  discount_percent: null,
  discount_amount: null,
  free_gift: '',
  badge_text: 'Урамшуулал',
  badge_color: '#F23645',
  target_type: 'service',
  target_id: '',
  show_on_landing: true,
  show_on_result: true,
  is_active: true,
  starts_at: '',
  ends_at: '',
}

function toPromotionInput(promotion?: Promotion | null): PromotionInput {
  if (!promotion) {
    return blankPromotion
  }

  return {
    id: promotion.id,
    title: promotion.title,
    description: promotion.description ?? '',
    discount_percent: promotion.discount_percent,
    discount_amount: promotion.discount_amount,
    free_gift: promotion.free_gift ?? '',
    badge_text: promotion.badge_text,
    badge_color: promotion.badge_color,
    target_type: promotion.package_id ? 'package' : 'service',
    target_id: promotion.package_id ?? promotion.service_id ?? '',
    show_on_landing: promotion.show_on_landing,
    show_on_result: promotion.show_on_result,
    is_active: promotion.is_active,
    starts_at: promotion.starts_at ?? '',
    ends_at: promotion.ends_at ?? '',
  }
}

export default function PromotionsManager({
  initialPromotions,
  services,
  packages,
}: {
  initialPromotions: Promotion[]
  services: Array<{ id: string; name: string }>
  packages: Array<{ id: string; title: string }>
}) {
  const { pending, error, success, runAction } = useServerAction()
  const [promotions, setPromotions] = useState(initialPromotions)
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(
    initialPromotions[0]?.id ?? null
  )
  const [form, setForm] = useState<PromotionInput>(toPromotionInput(initialPromotions[0] ?? null))
  const [search, setSearch] = useState('')

  useEffect(() => {
    setPromotions(initialPromotions)
    const selected =
      initialPromotions.find((promotion) => promotion.id === selectedPromotionId) ??
      initialPromotions[0]
    setSelectedPromotionId(selected?.id ?? null)
    setForm(toPromotionInput(selected ?? null))
  }, [initialPromotions, selectedPromotionId])

  const filteredPromotions = useMemo(() => {
    return promotions.filter((promotion) =>
      promotion.title.toLowerCase().includes(search.trim().toLowerCase())
    )
  }, [promotions, search])

  const targets =
    form.target_type === 'service'
      ? services.map((item) => ({ id: item.id, label: item.name }))
      : packages.map((item) => ({ id: item.id, label: item.title }))

  function openPromotion(promotion?: Promotion) {
    setSelectedPromotionId(promotion?.id ?? null)
    setForm(toPromotionInput(promotion ?? null))
  }

  function getTargetLabel(promotion: Promotion) {
    if (promotion.package_id) {
      return packages.find((item) => item.id === promotion.package_id)?.title ?? 'Багц'
    }

    return services.find((item) => item.id === promotion.service_id)?.name ?? 'Үйлчилгээ'
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <AdminPageHeader
        eyebrow="Promotions"
        title="Урамшуулал ба target холбоос"
        description="Урамшууллыг үйлчилгээ эсвэл багцтай холбож, badge, хөнгөлөлт, үнэгүй бэлэг болон харагдах байршлыг удирдана."
      />

      {error ? <AdminMessage tone="error">{error}</AdminMessage> : null}
      {success ? <AdminMessage tone="success">{success}</AdminMessage> : null}

      <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.2fr]">
        <AdminSectionCard
          title={selectedPromotionId ? 'Урамшуулал засах' : 'Шинэ урамшуулал'}
          description="Service эсвэл package target-тай холбосон conversion давхаргыг тохируулна."
          action={
            <button
              type="button"
              onClick={() => openPromotion()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus size={14} />
              Шинэ урамшуулал
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
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </AdminField>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Target төрөл">
                <AdminSelect
                  value={form.target_type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      target_type: event.target.value as 'service' | 'package',
                      target_id: '',
                    }))
                  }
                >
                  <option value="service">Үйлчилгээ</option>
                  <option value="package">Багц</option>
                </AdminSelect>
              </AdminField>
              <AdminField label="Target">
                <AdminSelect
                  value={form.target_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, target_id: event.target.value }))
                  }
                >
                  <option value="">Сонгох</option>
                  {targets.map((target) => (
                    <option key={target.id} value={target.id}>
                      {target.label}
                    </option>
                  ))}
                </AdminSelect>
              </AdminField>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Хувийн хөнгөлөлт (%)">
                <AdminInput
                  type="number"
                  min={0}
                  max={100}
                  value={form.discount_percent ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      discount_percent: event.target.value
                        ? Number(event.target.value)
                        : null,
                    }))
                  }
                />
              </AdminField>
              <AdminField label="Дүнгийн хөнгөлөлт">
                <AdminInput
                  type="number"
                  min={0}
                  value={form.discount_amount ?? ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      discount_amount: event.target.value
                        ? Number(event.target.value)
                        : null,
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
                    setForm((current) => ({
                      ...current,
                      badge_text: event.target.value,
                    }))
                  }
                />
              </AdminField>
              <AdminField label="Badge өнгө">
                <AdminInput
                  type="color"
                  value={form.badge_color}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      badge_color: event.target.value,
                    }))
                  }
                  className="h-12"
                />
              </AdminField>
            </div>

            <AdminField label="Үнэгүй бэлгийн текст">
              <AdminInput
                value={form.free_gift}
                onChange={(event) =>
                  setForm((current) => ({ ...current, free_gift: event.target.value }))
                }
              />
            </AdminField>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="Эхлэх хугацаа">
                <AdminInput
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, starts_at: event.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Дуусах хугацаа">
                <AdminInput
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, ends_at: event.target.value }))
                  }
                />
              </AdminField>
            </div>

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

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  runAction(() => savePromotion(form), {
                    successMessage: selectedPromotionId
                      ? 'Урамшуулал шинэчлэгдлээ.'
                      : 'Шинэ урамшуулал бүртгэгдлээ.',
                  })
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-semibold text-white"
              >
                <Save size={16} />
                Хадгалах
              </button>

              {selectedPromotionId ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm('Энэ урамшууллыг устгах уу?')) {
                      return
                    }

                    runAction(() => deletePromotion(selectedPromotionId), {
                      successMessage: 'Урамшуулал устгагдлаа.',
                    })
                    openPromotion()
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
          title="Урамшууллын жагсаалт"
          description="Хугацаа, target, result/landing харагдац болон active төлөвийг нэг дор хянана."
        >
          <div className="space-y-4">
            <AdminInput
              placeholder="Урамшууллын нэрээр хайх"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {filteredPromotions.length === 0 ? (
              <AdminEmptyState
                title="Урамшуулал алга"
                description="Шинэ service/package promotion үүсгэж урсгалын conversion блокыг идэвхжүүлнэ үү."
                actionLabel="Шинэ урамшуулал"
                onAction={() => openPromotion()}
              />
            ) : (
              <div className="space-y-3">
                {filteredPromotions.map((promotion) => (
                  <div
                    key={promotion.id}
                    className={[
                      'rounded-2xl border p-4 transition',
                      selectedPromotionId === promotion.id
                        ? 'border-[#B8D5FB] bg-[#F7FAFF]'
                        : 'border-[#E5E7EB] bg-white',
                    ].join(' ')}
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                      <button
                        type="button"
                        onClick={() => openPromotion(promotion)}
                        className="text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-base font-bold text-[#1F2937]">
                            {promotion.title}
                          </p>
                          <span
                            className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                            style={{ backgroundColor: promotion.badge_color }}
                          >
                            {promotion.badge_text}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[#6B7280]">
                          {getTargetLabel(promotion)}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2 text-sm">
                          {promotion.discount_percent ? (
                            <span className="font-semibold text-[#F23645]">
                              -{promotion.discount_percent}%
                            </span>
                          ) : null}
                          {promotion.discount_amount ? (
                            <span className="font-semibold text-[#F23645]">
                              -{Number(promotion.discount_amount).toLocaleString('mn-MN')}₮
                            </span>
                          ) : null}
                          {promotion.free_gift ? (
                            <span className="text-[#16A34A]">
                              Бэлэг: {promotion.free_gift}
                            </span>
                          ) : null}
                        </div>
                      </button>

                      <div className="flex flex-wrap gap-2">
                        <AdminToggle
                          label="Landing"
                          active={promotion.show_on_landing}
                          onClick={() =>
                            runAction(() =>
                              savePromotion({
                                ...toPromotionInput(promotion),
                                show_on_landing: !promotion.show_on_landing,
                              })
                            )
                          }
                        />
                        <AdminToggle
                          label="Result"
                          active={promotion.show_on_result}
                          onClick={() =>
                            runAction(() =>
                              savePromotion({
                                ...toPromotionInput(promotion),
                                show_on_result: !promotion.show_on_result,
                              })
                            )
                          }
                        />
                        <AdminToggle
                          label="Идэвхтэй"
                          active={promotion.is_active}
                          onClick={() =>
                            runAction(() =>
                              savePromotion({
                                ...toPromotionInput(promotion),
                                is_active: !promotion.is_active,
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
