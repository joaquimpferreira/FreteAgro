// app/(auth)/cadastro/frota/page.tsx — Registration step 2 (dados da frota)
// "use client" — reads step1 data from sessionStorage and submits the full form
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CadastroStep2Form } from '@/components/auth/CadastroStep2Form'

interface Step1Data {
  nome: string
  email: string
  whatsapp: string
  senha: string
}

export default function CadastroFrotaPage() {
  const router = useRouter()
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('__cadastro_step1')
    if (!raw) {
      // Step 1 not completed — go back to start
      router.replace('/cadastro')
      return
    }
    try {
      const parsed = JSON.parse(raw) as Step1Data
      setStep1Data(parsed)
    } catch {
      router.replace('/cadastro')
    }
  }, [router])

  function handleBack() {
    router.push('/cadastro')
  }

  if (!step1Data) {
    return null // loading or redirecting
  }

  return (
    <div className="rounded-card bg-surface-card p-8 shadow-lg">
      {/* Progress indicator */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-grey-700 text-p-xs font-medium text-grey-400">
          1
        </div>
        <div className="h-px flex-1 bg-primary-400" />
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-400 text-p-xs font-bold text-grey-900">
          2
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-h3 font-semibold text-grey-50">Dados da frota</h2>
        <p className="mt-1 text-p-sm text-grey-400">Informações sobre sua empresa ou frota</p>
      </div>

      <CadastroStep2Form step1Data={step1Data} onBack={handleBack} />
    </div>
  )
}
