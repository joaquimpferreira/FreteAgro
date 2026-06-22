// app/(dashboard)/perfil/page.tsx — User profile page (US1 / FR-008)
// Server Component — fetches profile data server-side and passes to client form.

import { auth } from '@/lib/auth/config'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { PerfilForm } from './_components/PerfilForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Truck, Users, Package, Calendar } from 'lucide-react'

export const metadata = { title: 'Perfil — FreteAgro' }

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day:   '2-digit',
    month: 'long',
    year:  'numeric',
  })
}

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-card border border-grey-800 bg-surface-elevated px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-input bg-primary-400/10">
        <Icon className="h-4 w-4 text-primary-400" aria-hidden="true" />
      </div>
      <div>
        <p className="text-h6 font-bold text-grey-50">{value}</p>
        <p className="text-caption text-grey-400">{label}</p>
      </div>
    </div>
  )
}

export default async function PerfilPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = await auth() as any
  if (!session?.user) redirect('/login')

  const userId  = (session.user.id ?? session.user.sub)  as string | undefined
  const frotaId = session.user.frotaId as string
  const role    = session.user.role    as string

  const [user, frota] = await Promise.all([
    userId
      ? prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: { id: true, nome: true, email: true, whatsapp: true, role: true, createdAt: true },
        })
      : prisma.user.findUniqueOrThrow({
          where: { email: session.user.email as string },
          select: { id: true, nome: true, email: true, whatsapp: true, role: true, createdAt: true },
        }),
    prisma.frota.findUnique({
      where: { id: frotaId },
      select: { id: true, nome: true, estado: true, cnpjCpf: true, createdAt: true },
    }),
  ])

  const [totalCaminhoes, totalMotoristas, totalFretes] = await Promise.all([
    prisma.caminhao.count({ where: { frotaId, status: 'ativo' } }),
    prisma.motorista.count({ where: { frotaId, status: 'ativo' } }),
    prisma.frete.count({ where: { frotaId } }),
  ])

  // Build initials from name for avatar
  const initials = user.nome
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? '')
    .join('')

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-h2 font-semibold text-grey-50">Perfil</h1>
        <p className="mt-1 text-p-sm text-grey-400">Gerencie seus dados pessoais e da frota</p>
      </div>

      {/* Avatar + identity card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            {/* Avatar initials circle */}
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary-400/20 text-h4 font-bold text-primary-300"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-h5 font-semibold text-grey-50">{user.nome}</h2>
              <p className="truncate text-p-sm text-grey-400">{user.email}</p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <Badge variant={role === 'dono' ? 'default' : 'secondary'}>
                  {role === 'dono' ? 'Dono da frota' : 'Motorista'}
                </Badge>
                {frota && (
                  <span className="text-caption text-grey-500">{frota.nome}</span>
                )}
              </div>
            </div>
          </div>

          {/* Member since */}
          <div className="mt-4 flex items-center gap-2 text-caption text-grey-500">
            <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Membro desde {formatDate(user.createdAt)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Fleet stats — dono only */}
      {role === 'dono' && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Truck}   label="Caminhões ativos" value={totalCaminhoes} />
          <StatCard icon={Users}   label="Motoristas ativos" value={totalMotoristas} />
          <StatCard icon={Package} label="Fretes registrados" value={totalFretes} />
        </div>
      )}

      {/* Editable form */}
      <Card>
        <CardHeader>
          <CardTitle>Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <PerfilForm
            initialUser={{
              nome:     user.nome,
              whatsapp: user.whatsapp,
            }}
            email={user.email}
            initialFrota={role === 'dono' && frota ? {
              frotaNome: frota.nome,
              estado:    frota.estado,
              cnpjCpf:   frota.cnpjCpf ?? '',
            } : undefined}
            isDono={role === 'dono'}
          />
        </CardContent>
      </Card>
    </div>
  )
}
