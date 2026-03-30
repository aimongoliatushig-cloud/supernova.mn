import { redirect } from 'next/navigation'

type LegacyLoginSearchParams = Promise<{
  next?: string
}>

export default async function LegacyLoginPage({
  searchParams,
}: {
  searchParams: LegacyLoginSearchParams
}) {
  const params = await searchParams
  const next = typeof params.next === 'string' ? params.next : null

  redirect(next ? `/login?next=${encodeURIComponent(next)}` : '/login')
}
