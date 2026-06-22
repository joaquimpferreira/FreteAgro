// components/dashboard/AlertaBanner.tsx — Attention alert banner (US6, FR-028, FR-015)
// Displays actionable banners for acertos pendentes and caminhões sem motorista.
// Server Component — no interactivity; data passed as props.

import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

interface AlertaBannerProps {
  acertosPendentes: number
  caminhoesSemMotorista: number
}

export function AlertaBanner({ acertosPendentes, caminhoesSemMotorista }: AlertaBannerProps) {
  const hasAlerts = acertosPendentes > 0 || caminhoesSemMotorista > 0
  if (!hasAlerts) return null

  return (
    <div className="flex flex-wrap gap-2">
      {acertosPendentes > 0 && (
        <Link
          href="/acertos"
          className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-300 transition-colors hover:bg-yellow-500/15"
          aria-label={`${acertosPendentes} acerto(s) pendente(s) — clique para ver`}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-semibold">{acertosPendentes}</span>
            {acertosPendentes === 1
              ? ' acerto pendente'
              : ' acertos pendentes'}
          </span>
        </Link>
      )}

      {caminhoesSemMotorista > 0 && (
        <Link
          href="/frota"
          className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-sm text-orange-300 transition-colors hover:bg-orange-500/15"
          aria-label={`${caminhoesSemMotorista} caminhão(ões) sem motorista — clique para ver`}
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-semibold">{caminhoesSemMotorista}</span>
            {caminhoesSemMotorista === 1
              ? ' caminhão sem motorista'
              : ' caminhões sem motorista'}
          </span>
        </Link>
      )}
    </div>
  )
}
