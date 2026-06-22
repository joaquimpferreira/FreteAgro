// components/acertos/ComprovanteButton.tsx — generates and opens PDF receipt
// "use client" — event handler for PDF generation

'use client'

import { useState } from 'react'
import { FileDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ComprovanteButtonProps {
  acertoId: string
  existingUrl?: string | null
  onGenerate?: (id: string) => Promise<string>
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export function ComprovanteButton({
  acertoId,
  existingUrl,
  onGenerate,
  variant = 'outline',
  size = 'default',
}: ComprovanteButtonProps) {
  const [loading, setLoading] = useState(false)
  const [url, setUrl]         = useState<string | null>(existingUrl ?? null)
  const [error, setError]     = useState<string | null>(null)

  const handleClick = async () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    if (!onGenerate) return

    setLoading(true)
    setError(null)
    try {
      const generated = await onGenerate(acertoId)
      setUrl(generated)
      window.open(generated, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar comprovante.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={loading}
        aria-label="Gerar ou baixar comprovante PDF"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
        )}
        {url ? 'Baixar Comprovante' : 'Gerar Comprovante'}
      </Button>
      {error && <p className="text-caption text-error">{error}</p>}
    </div>
  )
}
