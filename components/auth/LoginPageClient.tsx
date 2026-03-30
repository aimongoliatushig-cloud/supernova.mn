'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react'
import { Suspense, useState } from 'react'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

const FALLBACK_SUPER_ADMIN_EMAIL = 'admin@gmail.com'

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
      setError('Нэвтрэх мэдээлэл буруу байна.')
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

    const role =
      profile?.role ??
      (user.email?.toLowerCase() === FALLBACK_SUPER_ADMIN_EMAIL ? 'super_admin' : 'patient')
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(30,99,181,0.12),_transparent_32%),linear-gradient(180deg,#F7FAFF_0%,#FFFFFF_100%)] px-4 py-10 md:px-6">
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-[#D8E6F6] bg-white p-7 shadow-[0_30px_100px_rgba(17,37,68,0.12)] md:p-8">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-[#EFF6FF] px-4 py-2 text-xs font-bold tracking-[0.22em] text-[#1E63B5]">
            <ShieldCheck size={14} />
            SECURE ACCESS
          </p>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-[#10233B]">Нэвтрэх</h1>
          <p className="mt-3 text-sm leading-7 text-[#5B6877]">
            Энгийн хэрэглэгч, эмч, ажилтан, админ хэрэглэгч бүгд энэ хэсгээр нэвтэрнэ.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-[#10233B]">И-мэйл</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              className="w-full rounded-2xl border border-[#D8E6F6] bg-[#FBFDFF] px-4 py-3.5 text-sm text-[#10233B] outline-none transition focus:border-[#1E63B5] focus:ring-4 focus:ring-[#1E63B5]/10"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#10233B]">Нууц үг</label>
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

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-semibold text-[#1E63B5]">
            Нүүр хуудас руу буцах
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPageClient() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7FAFF]" />}>
      <LoginContent />
    </Suspense>
  )
}
