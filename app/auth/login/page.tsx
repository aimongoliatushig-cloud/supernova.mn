'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, LogIn, Shield } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [show,     setShow]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) { setError('Имэйл болон нууц үгийг оруулна уу.'); return }
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Имэйл эсвэл нууц үг буруу байна.')
      setLoading(false)
      return
    }

    // Get role and redirect
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role ?? 'patient'
      const redirectMap: Record<string, string> = {
        office_assistant: '/dashboard/assistant',
        doctor:           '/dashboard/doctor',
        super_admin:      '/dashboard/admin',
        patient:          '/',
      }
      router.push(redirectMap[role] ?? '/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF3FF] to-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-black mb-1">
            <span className="text-[#E8323F]">СУПЕР</span>
            <span className="text-[#1E63B5]">НОВА</span>
          </div>
          <div className="text-xs text-[#9CA3AF] uppercase tracking-widest">
            Дотоод систем
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-[#E5E7EB] shadow-sm p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-full bg-[#EAF3FF] flex items-center justify-center">
              <LogIn size={16} className="text-[#1E63B5]" />
            </div>
            <h1 className="text-lg font-black text-[#1F2937]">Нэвтрэх</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">Имэйл</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E63B5] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1F2937] mb-1.5">Нууц үг</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-[#1E63B5] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[#FEE9EB] border border-[#fcd0d2] rounded-xl px-4 py-3 text-sm text-[#E8323F]">
                {error}
              </div>
            )}

            <Button type="submit" fullWidth size="lg" loading={loading}>
              <LogIn size={16} /> Нэвтрэх
            </Button>
          </form>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#9CA3AF]">
          <Shield size={12} className="text-[#1E63B5]" />
          Зөвхөн ажилтнуудад зориулсан систем
        </div>
      </div>
    </div>
  )
}
