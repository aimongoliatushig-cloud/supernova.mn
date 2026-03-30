import { redirect } from 'next/navigation'
import { getCurrentViewer } from '@/lib/admin/auth'

export default async function AdminEntryPage() {
  const viewer = await getCurrentViewer()

  if (!viewer) {
    redirect('/login')
  }

  if (viewer.role === 'super_admin') {
    redirect('/dashboard/admin')
  }

  redirect('/dashboard')
}
