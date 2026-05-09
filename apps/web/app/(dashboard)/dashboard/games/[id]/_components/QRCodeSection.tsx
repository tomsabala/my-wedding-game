'use client'

import { useRef } from 'react'
import QRCode from 'react-qr-code'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

type Props = { slug: string }

export default function QRCodeSection({ slug }: Props) {
  const t = useTranslations('dashboard.deploy')
  const containerRef = useRef<HTMLDivElement>(null)
  const url = typeof window !== 'undefined' ? `${window.location.origin}/${slug}` : `/${slug}`

  function downloadPng() {
    const svgEl = containerRef.current?.querySelector('svg')
    if (!svgEl) return

    const svgString = new XMLSerializer().serializeToString(svgEl)
    const blob = new Blob([svgString], { type: 'image/svg+xml' })
    const blobUrl = URL.createObjectURL(blob)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return
        const pngUrl = URL.createObjectURL(pngBlob)
        const a = document.createElement('a')
        a.href = pngUrl
        a.download = 'qr.png'
        a.click()
        URL.revokeObjectURL(pngUrl)
      }, 'image/png')
      URL.revokeObjectURL(blobUrl)
    }
    img.src = blobUrl
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={containerRef} className="rounded-lg border p-4 bg-white">
        <QRCode value={url} size={160} />
      </div>
      <Button variant="outline" size="sm" onClick={downloadPng}>
        {t('downloadQr')}
      </Button>
    </div>
  )
}
