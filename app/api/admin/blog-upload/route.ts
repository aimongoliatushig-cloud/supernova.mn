import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/admin/auth'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

export async function POST(request: Request) {
  await requireRole(['super_admin'])

  const formData = await request.formData()
  const image = formData.get('image')

  if (!(image instanceof File)) {
    return NextResponse.json({ error: 'Image file required.' }, { status: 400 })
  }

  if (!(image.type in MIME_EXTENSIONS)) {
    return NextResponse.json(
      { error: 'Only JPG, PNG, WEBP, and GIF images are supported.' },
      { status: 400 }
    )
  }

  if (image.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'Image size must be 5MB or smaller.' },
      { status: 400 }
    )
  }

  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'blog')
  await mkdir(uploadDir, { recursive: true })

  const extension = MIME_EXTENSIONS[image.type]
  const filename = `${Date.now()}-${randomUUID()}${extension}`
  const buffer = Buffer.from(await image.arrayBuffer())

  await writeFile(path.join(uploadDir, filename), buffer)

  return NextResponse.json({
    url: `/uploads/blog/${filename}`,
  })
}
