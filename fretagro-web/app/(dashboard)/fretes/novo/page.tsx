// app/(dashboard)/fretes/novo/page.tsx — New freight registration page
// "use client" — form page with client-side data fetching for truck select

'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FreteForm } from '@/components/fretes/FreteForm'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { FreteCreateInput } from '@/lib/fretes/schemas'

interface CaminhaoOption {
  id: string
  placa: string
  modelo: string
}

export default function NovoFretePage() {
  const router = useRouter()
  const [caminhoes, setCaminhoes] = useState<CaminhaoOption[]>([])
  const [loadingCaminhoes, setLoadingCaminhoes] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Load active trucks for the select
  useEffect(() => {
    fetch('/api/caminhoes?status=ativo&pageSize=50')
      .then((r) => r.json())
      .then((d) => setCaminhoes(d.data ?? []))
      .catch(() => setErrorMsg('Erro ao carregar caminhões.'))
      .finally(() => setLoadingCaminhoes(false))
  }, [])

  async function handleSubmit(data: FreteCreateInput) {
    setIsSaving(true)
    setErrorMsg(null)
    try {
      const res = await fetch('/api/fretes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(data),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.message ?? 'Erro ao registrar frete.')
      }
      const frete = await res.json()
      router.push(`/fretes/${frete.id}`)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label="Voltar">
          <Link href="/fretes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-h2 font-semibold text-grey-50">Novo frete</h1>
          <p className="mt-1 text-p-sm text-grey-400">Preencha os dados do transporte</p>
        </div>
      </div>

      {/* Error */}
      {errorMsg && (
        <div role="alert" className="rounded-card border border-error-400/30 bg-error-400/10 px-4 py-3">
          <p className="text-p-sm text-error-300">{errorMsg}</p>
        </div>
      )}

      {/* Form */}
      {loadingCaminhoes ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="rounded-card border border-grey-700 bg-surface-card p-6">
          <FreteForm
            caminhoes={caminhoes}
            onSubmit={handleSubmit}
            isLoading={isSaving}
          />
        </div>
      )}
    </div>
  )
}
