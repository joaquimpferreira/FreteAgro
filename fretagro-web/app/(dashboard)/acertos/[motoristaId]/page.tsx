// app/(dashboard)/acertos/[motoristaId]/page.tsx — Per-driver settlement detail/history
// "use client" — handles confirm and PDF generation
// FR-026 · contracts/acertos.md

'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'
import { AcertoCalculado } from '@/components/acertos/AcertoCalculado'
import { useAcertos } from '@/hooks/useAcertos'
import type { AcertoDetalhe } from '@/hooks/useAcertos'

export default function MotoristaAcertosPage() {
  const params = useParams<{ motoristaId: string }>()
  const motoristaId = params?.motoristaId ?? ''

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data, loading, error, confirmAcerto, gerarComprovante } = useAcertos({
    motoristaId,
  })

  const motoristaNome = data?.data[0]?.motorista.nome

  const handleConfirm = async (id: string) => {
    setErrorMsg(null)
    try {
      await confirmAcerto(id)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao confirmar acerto.')
      throw err
    }
  }

  const handleComprovante = async (id: string): Promise<string> => {
    setErrorMsg(null)
    try {
      return await gerarComprovante(id)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao gerar comprovante.')
      throw err
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return (
    <div className="flex flex-col gap-6">
      <Link href="/acertos" className="flex items-center gap-1 text-p-sm text-grey-400 hover:text-grey-200 w-fit">
        <ArrowLeft className="h-4 w-4" />
        Acertos
      </Link>
      <p className="text-error text-p-sm">{error}</p>
    </div>
  )

  const pendentes  = data?.data.filter((a) => a.status === 'pendente')  ?? []
  const realizados = data?.data.filter((a) => a.status === 'realizado') ?? []

  return (
    <div className="flex flex-col gap-6">
      {/* Back nav */}
      <Link
        href="/acertos"
        className="flex items-center gap-1 text-p-sm text-grey-400 hover:text-grey-200 w-fit"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Acertos
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-h2 font-semibold text-grey-50">
          {motoristaNome ?? 'Motorista'}
        </h1>
        <p className="mt-1 text-p-sm text-grey-400">
          Histórico e acertos pendentes
        </p>
      </div>

      {/* Error banner */}
      {errorMsg && (
        <p className="rounded-input bg-error/10 border border-error/40 px-4 py-2 text-p-sm text-error">
          {errorMsg}
        </p>
      )}

      {/* No acertos at all */}
      {!data || data.data.length === 0 ? (
        <EmptyState
          title="Nenhum acerto encontrado"
          description="Acertos são gerados ao concluir um frete vinculado a este motorista."
        />
      ) : (
        <>
          {/* Pending settlements */}
          {pendentes.length > 0 && (
            <section aria-labelledby="pendentes-heading">
              <h2
                id="pendentes-heading"
                className="text-p-md font-semibold text-grey-200 mb-3"
              >
                Aguardando confirmação
              </h2>
              <div className="flex flex-col gap-4">
                {pendentes.map((acerto) => (
                  <AcertoCalculado
                    key={acerto.id}
                    acerto={acerto as AcertoDetalhe}
                    onConfirm={handleConfirm}
                    onGerarComprovante={handleComprovante}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Settled history */}
          {realizados.length > 0 && (
            <section aria-labelledby="realizados-heading">
              <h2
                id="realizados-heading"
                className="text-p-md font-semibold text-grey-200 mb-3"
              >
                Histórico de acertos realizados
              </h2>
              <div className="flex flex-col gap-4">
                {realizados.map((acerto) => (
                  <AcertoCalculado
                    key={acerto.id}
                    acerto={acerto as AcertoDetalhe}
                    onGerarComprovante={handleComprovante}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Pagination info */}
      {data && data.pagination.totalPages > 1 && (
        <p className="text-caption text-grey-500 text-center">
          Página {data.pagination.page} de {data.pagination.totalPages}
        </p>
      )}
    </div>
  )
}
