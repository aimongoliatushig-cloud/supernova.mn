'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { AdminActionResult } from '@/lib/admin/types'

type ActionFactory = () => Promise<AdminActionResult<unknown>>

export function useServerAction() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const runAction = useCallback(
    (factory: ActionFactory, options?: { refresh?: boolean; successMessage?: string }) => {
      setError(null)
      setSuccess(null)

      startTransition(async () => {
        const result = await factory()

        if (!result.ok) {
          setError(result.error)
          return
        }

        setSuccess(options?.successMessage ?? result.message ?? null)

        if (options?.refresh !== false) {
          router.refresh()
        }
      })
    },
    [router]
  )

  return {
    pending,
    error,
    success,
    setError,
    setSuccess,
    runAction,
  }
}
