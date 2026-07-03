// types/frota.ts — fleet, truck, and driver domain types
// Layer: types — no imports from lib/, hooks/, components/, or app/

export type StatusAtivo = 'ativo' | 'inativo'
export type TipoCarroceria = 'graneleiro' | 'tanque' | 'bau' | 'plataforma' | 'outro'
export type TipoContrato = 'autonomo' | 'clt'

export interface Frota {
  id: string
  nome: string
  cnpjCpf?: string
  estado: string
  createdAt: string
  ownerId: string
}

export interface Caminhao {
  id: string
  placa: string
  modelo: string
  ano?: number
  carroceria?: TipoCarroceria
  status: StatusAtivo
  frotaId: string
  motoristaId?: string
  motorista?: MotoristaResumo
  createdAt: string
}

export interface Motorista {
  id: string
  nome: string
  cpf?: string
  whatsapp: string
  percentualComissao: number
  tipoContrato: TipoContrato
  status: StatusAtivo
  appAtivado: boolean
  frotaId: string
  caminhao?: CaminhaoResumo
  createdAt: string
}

// Slim projections used in relations to avoid circular references
export interface MotoristaResumo {
  id: string
  nome: string
  whatsapp: string
  percentualComissao: number
  status: StatusAtivo
}

export interface CaminhaoResumo {
  id: string
  placa: string
  modelo: string
  status: StatusAtivo
}

// Input types for create/update operations
export interface CaminhaoCreateInput {
  placa: string
  modelo: string
  ano?: number
  carroceria?: TipoCarroceria
}

export interface CaminhaoUpdateInput extends Partial<CaminhaoCreateInput> {
  status?: StatusAtivo
  motoristaId?: string | null
}

export interface MotoristaCreateInput {
  nome: string
  whatsapp: string
  percentualComissao: number
  tipoContrato?: TipoContrato
  cpf?: string
}

export interface MotoristaUpdateInput extends Partial<MotoristaCreateInput> {
  status?: StatusAtivo
}
