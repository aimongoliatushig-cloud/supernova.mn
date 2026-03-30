'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn, Shield, ShieldCheck } from 'lucide-react'
import { Suspense, useState } from 'react'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email || !password) {
      setError('И-мэйл болон нууц үгээ оруулна уу.')
      return
    }

    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('И-мэйл эсвэл нууц үг буруу байна.')
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Хэрэглэгчийн мэдээлэл уншигдсангүй. Дахин оролдоно уу.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role ?? 'patient'
    const nextPath = searchParams.get('next')
    const safeNextPath = nextPath?.startsWith('/dashboard') ? nextPath : null

    const redirectMap: Record<string, string> = {
      office_assistant: '/dashboard/assistant',
      doctor: '/dashboard/doctor',
      super_admin: '/dashboard/admin',
      patient: '/',
    }

    router.push(safeNextPath ?? redirectMap[role] ?? '/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(30,99,181,0.12),_transparent_30%),linear-gradient(180deg,#F7FAFF_0%,#FFFFFF_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[#D8E6F6] bg-white shadow-[0_30px_100px_rgba(17,37,68,0.12)] lg:grid-cols-[1fr_0.95fr]">
        <section className="relative overflow-hidden bg-[linear-gradient(160deg,#0E2C4F_0%,#123B67_60%,#1E63B5_100%)] p-7 text-white md:p-10">
          <div className="absolute -right-16 top-0 h-56 w-56 rounded-full bg-white/8 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[#E8323F]/15 blur-3xl" />

          <div className="relative">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.22em] text-blue-100">
              <ShieldCheck size={14} />
              STAFF ACCESS
            </p>

            <h1 className="mt-6 text-3xl font-black tracking-tight md:text-4xl">
              Админ болон ажилтны нэвтрэх хэсэг
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-blue-100">
              Super admin, эмч, оффисын ажилтнууд зөвхөн өөрт хамаарах самбар руу
              нэвтэрнэ. Нэвтэрсний дараа рольд нь тохирсон dashboard автоматаар нээгдэнэ.
            </p>

            <div className="mt-8 space-y-3">
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4">
                <p className="text-sm font-bold">1. Анхны тохиргоо</p>
                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Хэрэв admin хэрэглэгч үүсээгүй бол эхлээд <span className="font-semibold">/setup</span>
                  {' '}хуудсыг нээгээд schema, seed, super admin роль тохируулна.
                </p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4">
                <p className="text-sm font-bold">2. Нэвтрэх мэдээлэл</p>
                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Supabase Authentication дээр үүсгэсэн и-мэйл, нууц үгээр нэвтэрнэ.
                  `profiles.role` нь `super_admin`, `doctor`, `office_assistant` байх ёстой.
                </p>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/10 p-4">
                <p className="text-sm font-bold">3. Хаанаас орох вэ</p>
                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Нэвтрэх хаяг: <span className="font-semibold">/admin</span>
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/setup"
                className="inline-flex items-center rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#123B67] transition hover:bg-[#EAF3FF]"
              >
                Setup нээх
              </Link>
              <Link
                href="/"
                className="inline-flex items-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Нүүр хуудас руу буцах
              </Link>
            </div>
          </div>
        </section>

        <section className="p-7 md:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-8">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#EFF6FF] px-4 py-2 text-xs font-bold tracking-[0.22em] text-[#1E63B5]">
                <LogIn size={14} />
                SECURE LOGIN
              </p>
              <h2 className="mt-5 text-3xl font-black tracking-tight text-[#10233B]">
                Нэвтрэх
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#5B6877]">
                Нэвтрэсний дараа таны рольд тохирсон самбар автоматаар нээгдэнэ.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-[#10233B]">
                  И-мэйл
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@supernova.mn"
                  autoComplete="email"
                  className="w-full rounded-2xl border border-[#D8E6F6] bg-[#FBFDFF] px-4 py-3.5 text-sm text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:ring-4 focus:ring-[#1E63B5]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[#10233B]">
                  Нууц үг
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Нууц үгээ оруулна уу"
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-[#D8E6F6] bg-[#FBFDFF] px-4 py-3.5 pr-12 text-sm text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:ring-4 focus:ring-[#1E63B5]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-[#7A8796] transition hover:text-[#10233B]"
                    aria-label={showPassword ? 'Нууц үг нуух' : 'Нууц үг харах'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-2xl border border-[#FFD7DC] bg-[#FFF4F5] px-4 py-3 text-sm text-[#D63045]">
                  {error}
                </div>
              ) : null}

              <Button type="submit" size="lg" fullWidth loading={loading}>
                <LogIn size={16} />
                Нэвтрэх
              </Button>
            </form>

            <div className="mt-6 rounded-2xl border border-[#E6EEF8] bg-[#F8FBFF] px-4 py-4">
              <div className="flex items-start gap-3 text-sm text-[#5B6877]">
                <Shield size={16} className="mt-0.5 shrink-0 text-[#1E63B5]" />
                <p>
                  Анх удаа тохируулж байгаа бол <Link href="/setup" className="font-bold text-[#1E63B5] underline underline-offset-4">/setup</Link>
                  {' '}хуудсаар орж admin хэрэглэгч үүсгэнэ.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7FAFF]" />}>
      <LoginContent />
    </Suspense>
  )
}
