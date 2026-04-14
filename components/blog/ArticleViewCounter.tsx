'use client'

import { Eye } from 'lucide-react'
import { useEffect, useState } from 'react'

const STORAGE_PREFIX = 'supernova-blog-view:'

function formatViewCount(value: number) {
  return `${value.toLocaleString('en-US')} удаа үзсэн`
}

export default function ArticleViewCounter({
  slug,
  initialViews,
}: {
  slug: string
  initialViews: number
}) {
  const [viewCount, setViewCount] = useState(initialViews)

  useEffect(() => {
    const storageKey = `${STORAGE_PREFIX}${slug}`

    try {
      if (window.sessionStorage.getItem(storageKey) === '1') {
        return
      }
    } catch {
      // Ignore storage failures and continue with the request.
    }

    let isActive = true

    async function trackView() {
      try {
        const response = await fetch(`/api/blog/articles/${slug}/view`, {
          method: 'POST',
        })

        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as { viewCount?: number }

        if (isActive && typeof payload.viewCount === 'number') {
          setViewCount(payload.viewCount)
        }

        try {
          window.sessionStorage.setItem(storageKey, '1')
        } catch {
          // Ignore storage failures after the request succeeds.
        }
      } catch {
        // Ignore failed tracking requests on the client.
      }
    }

    void trackView()

    return () => {
      isActive = false
    }
  }, [slug])

  return (
    <span className="inline-flex items-center gap-2">
      <Eye size={16} className="text-[#1E63B5]" />
      {formatViewCount(viewCount)}
    </span>
  )
}
