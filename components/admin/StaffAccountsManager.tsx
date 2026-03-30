'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Shield, Trash2, UserCog } from 'lucide-react'
import { deleteStaffAccount, saveStaffAccount } from '@/app/dashboard/admin/actions'
import {
  AdminEmptyState,
  AdminField,
  AdminInput,
  AdminMessage,
  AdminPageHeader,
  AdminSectionCard,
  AdminSelect,
} from '@/components/admin/AdminPrimitives'
import { useServerAction } from '@/components/admin/useServerAction'

type StaffAccount = {
  id: string
  email: string
  full_name: string | null
  role: 'office_assistant' | 'super_admin'
  created_at: string
}

type StaffAccountInput = {
  id?: string
  full_name: string
  email: string
  role: 'office_assistant' | 'super_admin'
  password: string
}

const blankForm: StaffAccountInput = {
  full_name: '',
  email: '',
  role: 'office_assistant',
  password: '',
}

function toForm(account?: StaffAccount | null): StaffAccountInput {
  if (!account) {
    return blankForm
  }

  return {
    id: account.id,
    full_name: account.full_name ?? '',
    email: account.email,
    role: account.role,
    password: '',
  }
}

export default function StaffAccountsManager({
  initialAccounts,
}: {
  initialAccounts: StaffAccount[]
}) {
  const { pending, error, success, runAction } = useServerAction()
  const [accounts, setAccounts] = useState(initialAccounts)
  const [selectedId, setSelectedId] = useState<string | null>(initialAccounts[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<StaffAccountInput>(toForm(initialAccounts[0] ?? null))

  useEffect(() => {
    setAccounts(initialAccounts)
    if (!selectedId) {
      return
    }

    const selected = initialAccounts.find((account) => account.id === selectedId)
    if (selected) {
      setForm(toForm(selected))
      return
    }

    const fallback = initialAccounts[0] ?? null
    setSelectedId(fallback?.id ?? null)
    setForm(toForm(fallback))
  }, [initialAccounts, selectedId])

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase()

    return accounts.filter((account) => {
      if (!query) {
        return true
      }

      return (
        (account.full_name ?? '').toLowerCase().includes(query) ||
        account.email.toLowerCase().includes(query)
      )
    })
  }, [accounts, search])

  function openAccount(account?: StaffAccount) {
    setSelectedId(account?.id ?? null)
    setForm(toForm(account ?? null))
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <AdminPageHeader
        eyebrow="Staff Accounts"
        title="Оффис ба admin account удирдлага"
        description="Оффисын ажилтан болон нэмэлт super admin account-уудыг эндээс үүсгэж, role болон нууц үгийг шинэчилнэ. Эмчийн account-уудыг эмчийн модуль дээрээс удирдана."
      />

      {error ? <AdminMessage tone="error">{error}</AdminMessage> : null}
      {success ? <AdminMessage tone="success">{success}</AdminMessage> : null}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.1fr]">
        <AdminSectionCard
          title={selectedId ? 'Account засах' : 'Шинэ staff account'}
          description="Role-based dashboard access үүсгэх эсвэл шинэчлэх."
          action={
            <button
              type="button"
              onClick={() => openAccount()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1E63B5] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#154D8F]"
            >
              <Plus size={14} />
              Шинэ account
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

            <AdminField label="И-мэйл" required>
              <AdminInput
                type="email"
                autoComplete="username"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({ ...current, email: event.target.value }))
                }
              />
            </AdminField>

            <AdminField label="Role">
              <AdminSelect
                value={form.role}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    role: event.target.value as 'office_assistant' | 'super_admin',
                  }))
                }
              >
                <option value="office_assistant">Оффисын ажилтан</option>
                <option value="super_admin">Super admin</option>
              </AdminSelect>
            </AdminField>

            <AdminField
              label={selectedId ? 'Шинэ нууц үг' : 'Нууц үг'}
              hint={selectedId ? 'Хоосон үлдээвэл хуучин нууц үг хэвээр үлдэнэ.' : 'Шинэ account дээр заавал.'}
            >
              <AdminInput
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({ ...current, password: event.target.value }))
                }
              />
            </AdminField>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  runAction(() => saveStaffAccount(form), {
                    successMessage: selectedId
                      ? 'Staff account шинэчлэгдлээ.'
                      : 'Шинэ staff account үүсгэгдлээ.',
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
                    if (!window.confirm('Энэ staff account-ыг устгах уу?')) {
                      return
                    }

                    runAction(() => deleteStaffAccount(selectedId), {
                      successMessage: 'Staff account устгагдлаа.',
                    })
                    openAccount()
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
          title="Staff жагсаалт"
          description="Оффисын ажилтан болон super admin account-ууд."
        >
          <div className="space-y-4">
            <AdminInput
              placeholder="Нэр эсвэл и-мэйлээр хайх"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            {filteredAccounts.length === 0 ? (
              <AdminEmptyState
                title="Account олдсонгүй"
                description="Хайлтын шүүлтүүрээ өөрчилнө үү эсвэл шинэ account үүсгэнэ үү."
                actionLabel="Шинэ account"
                onAction={() => openAccount()}
              />
            ) : (
              <div className="space-y-3">
                {filteredAccounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => openAccount(account)}
                    className={[
                      'block w-full rounded-2xl border p-4 text-left transition',
                      selectedId === account.id
                        ? 'border-[#B8D5FB] bg-[#F7FAFF]'
                        : 'border-[#E5E7EB] bg-white',
                    ].join(' ')}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#1E63B5]">
                            {account.role === 'super_admin' ? (
                              <Shield size={18} />
                            ) : (
                              <UserCog size={18} />
                            )}
                          </div>
                          <div>
                            <p className="text-base font-bold text-[#1F2937]">
                              {account.full_name ?? 'Нэргүй account'}
                            </p>
                            <p className="text-sm text-[#6B7280]">{account.email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <span
                          className={[
                            'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                            account.role === 'super_admin'
                              ? 'bg-[#FFF1F2] text-[#F23645]'
                              : 'bg-[#EAF3FF] text-[#1E63B5]',
                          ].join(' ')}
                        >
                          {account.role === 'super_admin' ? 'Super admin' : 'Оффисын ажилтан'}
                        </span>
                        <p className="text-xs text-[#9CA3AF]">
                          {new Date(account.created_at).toLocaleDateString('mn-MN')}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </AdminSectionCard>
      </div>
    </div>
  )
}
