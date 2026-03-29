'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Plus, Save, Trash2 } from 'lucide-react'
import {
  deleteCmsEntry,
  deleteSocialLink,
  deleteWorkingHours,
  saveCmsEntry,
  saveContactSettings,
  saveSocialLink,
  saveWorkingHours,
} from '@/app/dashboard/admin/actions'
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
import type {
  CmsEntry,
  CmsEntryInput,
  ContactSettings,
  ContactSettingsInput,
  SocialLink,
  SocialLinkInput,
  WorkingHours,
  WorkingHoursInput,
} from '@/lib/admin/types'

const blankEntry: CmsEntryInput = {
  key: '',
  label: '',
  section: '',
  value: '',
}

const blankContact: ContactSettingsInput = {
  phone: '',
  address: '',
  email: '',
  map_embed: '',
}

const blankSocial: SocialLinkInput = {
  platform: '',
  url: '',
  is_active: true,
  sort_order: 0,
}

const blankHours: WorkingHoursInput = {
  day_label: '',
  open_time: '09:00',
  close_time: '18:00',
  is_active: true,
  sort_order: 0,
}

function toContactInput(contact?: ContactSettings | null): ContactSettingsInput {
  return {
    id: contact?.id,
    phone: contact?.phone ?? '',
    address: contact?.address ?? '',
    email: contact?.email ?? '',
    map_embed: contact?.map_embed ?? '',
  }
}

function getSectionName(section: string | null) {
  if (!section) return 'Бусад'

  const labels: Record<string, string> = {
    hero: 'Hero',
    about: 'Танилцуулга',
    technology: 'Технологи',
    values: 'Алсын хараа ба үнэт зүйлс',
    trust: 'Нууцлал ба итгэл',
    contact: 'Холбоо барих',
    cta: 'Үндсэн CTA',
  }

  return labels[section] ?? section
}

export default function CmsManager({
  initialEntries,
  initialContact,
  initialSocials,
  initialHours,
}: {
  initialEntries: CmsEntry[]
  initialContact: ContactSettings | null
  initialSocials: SocialLink[]
  initialHours: WorkingHours[]
}) {
  const { pending, error, success, runAction } = useServerAction()
  const [entries, setEntries] = useState<CmsEntry[]>(initialEntries)
  const [newEntry, setNewEntry] = useState<CmsEntryInput>(blankEntry)
  const [contact, setContact] = useState<ContactSettingsInput>({
    ...blankContact,
    ...toContactInput(initialContact),
  })
  const [socials, setSocials] = useState<SocialLink[]>(initialSocials)
  const [socialDraft, setSocialDraft] = useState<SocialLinkInput>(blankSocial)
  const [hours, setHours] = useState<WorkingHours[]>(initialHours)
  const [hoursDraft, setHoursDraft] = useState<WorkingHoursInput>(blankHours)

  useEffect(() => {
    setEntries(initialEntries)
  }, [initialEntries])

  useEffect(() => {
    setSocials(initialSocials)
  }, [initialSocials])

  useEffect(() => {
    setHours(initialHours)
  }, [initialHours])

  useEffect(() => {
    setContact(toContactInput(initialContact))
  }, [initialContact])

  const sections = useMemo(() => {
    const grouped = new Map<string, CmsEntry[]>()

    for (const entry of entries) {
      const key = entry.section ?? 'other'
      const bucket = grouped.get(key) ?? []
      bucket.push(entry)
      grouped.set(key, bucket)
    }

    return Array.from(grouped.entries()).sort(([left], [right]) => left.localeCompare(right))
  }, [entries])

  function updateEntry(id: string, patch: Partial<CmsEntry>) {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    )
  }

  function updateSocial(id: string, patch: Partial<SocialLink>) {
    setSocials((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    )
  }

  function updateHours(id: string, patch: Partial<WorkingHours>) {
    setHours((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry))
    )
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <AdminPageHeader
        eyebrow="Landing CMS"
        title="Нийтийн сайтын өгөгдөл"
        description="Hero контент, хаяг, ажиллах цаг, сошиал холбоос зэрэг олон нийтэд харагдах бүх өгөгдлийг DB-ээс удирдана."
        actions={
          <a
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-xl border border-[#B8D5FB] bg-white px-4 py-3 text-sm font-semibold text-[#1E63B5] transition hover:bg-[#EAF3FF]"
            rel="noreferrer"
          >
            Сайт харах
            <ExternalLink size={14} />
          </a>
        }
      />

      {error ? <AdminMessage tone="error">{error}</AdminMessage> : null}
      {success ? <AdminMessage tone="success">{success}</AdminMessage> : null}

      <AdminSectionCard
        title="Шинэ CMS талбар"
        description="Нүүр хуудасны шинэ динамик хэсэг эсвэл нэмэлт тайлбарын талбар үүсгэхэд ашиглана."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField label="Түлхүүр" required hint="Жишээ: hero_title">
            <AdminInput
              value={newEntry.key}
              onChange={(event) => setNewEntry((current) => ({ ...current, key: event.target.value }))}
            />
          </AdminField>
          <AdminField label="Харагдах нэр" required>
            <AdminInput
              value={newEntry.label}
              onChange={(event) =>
                setNewEntry((current) => ({ ...current, label: event.target.value }))
              }
            />
          </AdminField>
          <AdminField label="Хэсэг" required hint="Жишээ: hero, about, technology, trust">
            <AdminInput
              value={newEntry.section}
              onChange={(event) =>
                setNewEntry((current) => ({ ...current, section: event.target.value }))
              }
            />
          </AdminField>
          <AdminField label="Утга" required>
            <AdminInput
              value={newEntry.value}
              onChange={(event) =>
                setNewEntry((current) => ({ ...current, value: event.target.value }))
              }
            />
          </AdminField>
        </div>

        <div className="mt-4">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              runAction(
                async () => {
                  const result = await saveCmsEntry(newEntry)
                  if (result.ok) {
                    setNewEntry(blankEntry)
                  }
                  return result
                },
                { successMessage: 'Шинэ CMS талбар үүслээ.' }
              )
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#154D8F] disabled:opacity-60"
          >
            <Plus size={16} />
            Талбар нэмэх
          </button>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="CMS талбарууд"
        description="Landing page-ийн бүх текст, CTA, нууцлалын мессежийг section-аар нь бүлэглэн удирдана."
      >
        {entries.length === 0 ? (
          <AdminEmptyState
            title="CMS талбар алга"
            description="`seed-v2.sql` эсвэл шинэ `seed-v3.sql`-ийг ажиллуулсны дараа энд автомат жагсаалт үүснэ."
          />
        ) : (
          <div className="space-y-6">
            {sections.map(([section, sectionEntries]) => (
              <div key={section} className="space-y-3">
                <div className="rounded-xl bg-[#F7FAFF] px-4 py-3 text-sm font-bold text-[#1F2937]">
                  {getSectionName(section)}
                </div>

                <div className="space-y-3">
                  {sectionEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-[#E5E7EB] bg-white p-4"
                    >
                      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr]">
                        <AdminField label="Харагдах нэр">
                          <AdminInput
                            value={entry.label ?? ''}
                            onChange={(event) =>
                              updateEntry(entry.id, { label: event.target.value })
                            }
                          />
                        </AdminField>
                        <AdminField label="Түлхүүр">
                          <AdminInput
                            value={entry.key}
                            onChange={(event) =>
                              updateEntry(entry.id, { key: event.target.value })
                            }
                          />
                        </AdminField>
                        <AdminField label="Хэсэг">
                          <AdminInput
                            value={entry.section ?? ''}
                            onChange={(event) =>
                              updateEntry(entry.id, { section: event.target.value })
                            }
                          />
                        </AdminField>
                      </div>

                      <div className="mt-4">
                        <AdminField label="Утга">
                          <AdminTextArea
                            rows={3}
                            value={entry.value ?? ''}
                            onChange={(event) =>
                              updateEntry(entry.id, { value: event.target.value })
                            }
                          />
                        </AdminField>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            runAction(
                              () =>
                                saveCmsEntry({
                                  id: entry.id,
                                  key: entry.key,
                                  label: entry.label ?? '',
                                  section: entry.section ?? '',
                                  value: entry.value ?? '',
                                }),
                              { successMessage: 'CMS талбар хадгалагдлаа.' }
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-xl border border-[#B8D5FB] bg-[#EAF3FF] px-4 py-2.5 text-sm font-semibold text-[#1E63B5] transition hover:bg-[#DCEBFF]"
                        >
                          <Save size={14} />
                          Хадгалах
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            if (!window.confirm('Энэ CMS талбарыг устгах уу?')) {
                              return
                            }

                            runAction(() => deleteCmsEntry(entry.id), {
                              successMessage: 'CMS талбар устгагдлаа.',
                            })
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#F7D5D9] bg-[#FFF1F2] px-4 py-2.5 text-sm font-semibold text-[#F23645] transition hover:bg-[#FFE4E7]"
                        >
                          <Trash2 size={14} />
                          Устгах
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminSectionCard>

      <AdminSectionCard
        title="Холбоо барих мэдээлэл"
        description="Footer болон contact block-ийг удирдах үндсэн мэдээлэл."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField label="Утас">
            <AdminInput
              value={contact.phone}
              onChange={(event) => setContact((current) => ({ ...current, phone: event.target.value }))}
            />
          </AdminField>
          <AdminField label="Имэйл">
            <AdminInput
              value={contact.email}
              onChange={(event) => setContact((current) => ({ ...current, email: event.target.value }))}
            />
          </AdminField>
          <AdminField label="Хаяг">
            <AdminTextArea
              rows={3}
              value={contact.address}
              onChange={(event) =>
                setContact((current) => ({ ...current, address: event.target.value }))
              }
            />
          </AdminField>
          <AdminField label="Map embed">
            <AdminTextArea
              rows={3}
              value={contact.map_embed}
              onChange={(event) =>
                setContact((current) => ({ ...current, map_embed: event.target.value }))
              }
            />
          </AdminField>
        </div>

        <div className="mt-4">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              runAction(
                () =>
                  saveContactSettings({
                    id: initialContact?.id,
                    ...contact,
                  }),
                { successMessage: 'Холбоо барих мэдээлэл шинэчлэгдлээ.' }
              )
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#154D8F] disabled:opacity-60"
          >
            <Save size={16} />
            Холбоо барих мэдээлэл хадгалах
          </button>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Сошиал холбоосууд"
        description="Landing болон footer дээр харагдах сошиал сувгууд."
      >
        <div className="space-y-4">
          {socials.map((social) => (
            <div
              key={social.id}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-4"
            >
              <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr_0.8fr]">
                <AdminField label="Платформ">
                  <AdminInput
                    value={social.platform}
                    onChange={(event) =>
                      updateSocial(social.id, { platform: event.target.value })
                    }
                  />
                </AdminField>
                <AdminField label="URL">
                  <AdminInput
                    value={social.url}
                    onChange={(event) => updateSocial(social.id, { url: event.target.value })}
                  />
                </AdminField>
                <AdminField label="Дараалал">
                  <AdminInput
                    type="number"
                    value={social.sort_order}
                    onChange={(event) =>
                      updateSocial(social.id, { sort_order: Number(event.target.value) })
                    }
                  />
                </AdminField>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <AdminToggle
                  label="Идэвхтэй"
                  active={social.is_active}
                  onClick={() => updateSocial(social.id, { is_active: !social.is_active })}
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    runAction(() => saveSocialLink(social), {
                      successMessage: 'Сошиал холбоос хадгалагдлаа.',
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-[#B8D5FB] bg-[#EAF3FF] px-4 py-2.5 text-sm font-semibold text-[#1E63B5]"
                >
                  <Save size={14} />
                  Хадгалах
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm('Энэ сошиал холбоосыг устгах уу?')) {
                      return
                    }

                    runAction(() => deleteSocialLink(social.id), {
                      successMessage: 'Сошиал холбоос устгагдлаа.',
                    })
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#F7D5D9] bg-[#FFF1F2] px-4 py-2.5 text-sm font-semibold text-[#F23645]"
                >
                  <Trash2 size={14} />
                  Устгах
                </button>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#FAFBFD] p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_1.6fr_0.8fr]">
              <AdminField label="Шинэ платформ">
                <AdminInput
                  value={socialDraft.platform}
                  onChange={(event) =>
                    setSocialDraft((current) => ({ ...current, platform: event.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Шинэ URL">
                <AdminInput
                  value={socialDraft.url}
                  onChange={(event) =>
                    setSocialDraft((current) => ({ ...current, url: event.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Дараалал">
                <AdminInput
                  type="number"
                  value={socialDraft.sort_order}
                  onChange={(event) =>
                    setSocialDraft((current) => ({
                      ...current,
                      sort_order: Number(event.target.value),
                    }))
                  }
                />
              </AdminField>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <AdminToggle
                label="Идэвхтэй"
                active={socialDraft.is_active}
                onClick={() =>
                  setSocialDraft((current) => ({
                    ...current,
                    is_active: !current.is_active,
                  }))
                }
              />
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  runAction(
                    async () => {
                      const result = await saveSocialLink(socialDraft)
                      if (result.ok) {
                        setSocialDraft(blankSocial)
                      }
                      return result
                    },
                    { successMessage: 'Шинэ сошиал холбоос нэмэгдлээ.' }
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={14} />
                Сошиал нэмэх
              </button>
            </div>
          </div>
        </div>
      </AdminSectionCard>

      <AdminSectionCard
        title="Ажиллах цаг"
        description="Landing page болон footer дээр харагдах эмнэлгийн цагийн хуваарь."
      >
        <div className="space-y-4">
          {hours.map((hour) => (
            <div key={hour.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
              <div className="grid gap-4 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.7fr]">
                <AdminField label="Өдрийн шошго">
                  <AdminInput
                    value={hour.day_label}
                    onChange={(event) =>
                      updateHours(hour.id, { day_label: event.target.value })
                    }
                  />
                </AdminField>
                <AdminField label="Нээх цаг">
                  <AdminInput
                    type="time"
                    value={hour.open_time}
                    onChange={(event) =>
                      updateHours(hour.id, { open_time: event.target.value })
                    }
                  />
                </AdminField>
                <AdminField label="Хаах цаг">
                  <AdminInput
                    type="time"
                    value={hour.close_time}
                    onChange={(event) =>
                      updateHours(hour.id, { close_time: event.target.value })
                    }
                  />
                </AdminField>
                <AdminField label="Дараалал">
                  <AdminInput
                    type="number"
                    value={hour.sort_order}
                    onChange={(event) =>
                      updateHours(hour.id, { sort_order: Number(event.target.value) })
                    }
                  />
                </AdminField>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <AdminToggle
                  label="Идэвхтэй"
                  active={hour.is_active}
                  onClick={() => updateHours(hour.id, { is_active: !hour.is_active })}
                />
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    runAction(() => saveWorkingHours(hour), {
                      successMessage: 'Ажиллах цаг хадгалагдлаа.',
                    })
                  }
                  className="inline-flex items-center gap-2 rounded-xl border border-[#B8D5FB] bg-[#EAF3FF] px-4 py-2.5 text-sm font-semibold text-[#1E63B5]"
                >
                  <Save size={14} />
                  Хадгалах
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm('Энэ цагийн мөрийг устгах уу?')) {
                      return
                    }

                    runAction(() => deleteWorkingHours(hour.id), {
                      successMessage: 'Цагийн мөр устгагдлаа.',
                    })
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#F7D5D9] bg-[#FFF1F2] px-4 py-2.5 text-sm font-semibold text-[#F23645]"
                >
                  <Trash2 size={14} />
                  Устгах
                </button>
              </div>
            </div>
          ))}

          <div className="rounded-2xl border border-dashed border-[#D1D5DB] bg-[#FAFBFD] p-4">
            <div className="grid gap-4 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.7fr]">
              <AdminField label="Өдрийн шошго">
                <AdminInput
                  value={hoursDraft.day_label}
                  onChange={(event) =>
                    setHoursDraft((current) => ({ ...current, day_label: event.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Нээх цаг">
                <AdminInput
                  type="time"
                  value={hoursDraft.open_time}
                  onChange={(event) =>
                    setHoursDraft((current) => ({ ...current, open_time: event.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Хаах цаг">
                <AdminInput
                  type="time"
                  value={hoursDraft.close_time}
                  onChange={(event) =>
                    setHoursDraft((current) => ({ ...current, close_time: event.target.value }))
                  }
                />
              </AdminField>
              <AdminField label="Дараалал">
                <AdminInput
                  type="number"
                  value={hoursDraft.sort_order}
                  onChange={(event) =>
                    setHoursDraft((current) => ({
                      ...current,
                      sort_order: Number(event.target.value),
                    }))
                  }
                />
              </AdminField>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <AdminToggle
                label="Идэвхтэй"
                active={hoursDraft.is_active}
                onClick={() =>
                  setHoursDraft((current) => ({
                    ...current,
                    is_active: !current.is_active,
                  }))
                }
              />
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  runAction(
                    async () => {
                      const result = await saveWorkingHours(hoursDraft)
                      if (result.ok) {
                        setHoursDraft(blankHours)
                      }
                      return result
                    },
                    { successMessage: 'Шинэ цагийн мөр нэмэгдлээ.' }
                  )
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-2.5 text-sm font-semibold text-white"
              >
                <Plus size={14} />
                Цаг нэмэх
              </button>
            </div>
          </div>
        </div>
      </AdminSectionCard>
    </div>
  )
}
