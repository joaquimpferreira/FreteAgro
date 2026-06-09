// lib/api/errors.ts — standard API error shapes and HTTP helpers
// All Route Handlers use these to ensure a consistent error response format
// as specified in contracts/README.md.

import { NextResponse } from 'next/server'

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  // Domain-specific codes
  | 'EMAIL_TAKEN'
  | 'PLACA_TAKEN'
  | 'DRIVER_ALREADY_BOUND'
  | 'FREIGHT_NOT_CONCLUDED'
  | 'ACERTO_ALREADY_EXISTS'
  | 'ACERTO_ALREADY_REALIZADO'
  | 'INVALID_KM'
  | 'INVALID_STATUS_TRANSITION'

export interface ApiError {
  error: ApiErrorCode
  message: string
  details?: unknown
}

// ─── Response helpers ─────────────────────────────────────────────────────────

export function unauthorized(message = 'Sessão inválida ou expirada.') {
  return NextResponse.json<ApiError>({ error: 'UNAUTHORIZED', message }, { status: 401 })
}

export function forbidden(message = 'Acesso não autorizado.') {
  return NextResponse.json<ApiError>({ error: 'FORBIDDEN', message }, { status: 403 })
}

export function notFound(resource = 'Recurso') {
  return NextResponse.json<ApiError>(
    { error: 'NOT_FOUND', message: `${resource} não encontrado.` },
    { status: 404 },
  )
}

export function conflict(code: ApiErrorCode, message: string) {
  return NextResponse.json<ApiError>({ error: code, message }, { status: 409 })
}

export function validationError(details: unknown) {
  return NextResponse.json<ApiError>(
    { error: 'VALIDATION_ERROR', message: 'Dados inválidos.', details },
    { status: 422 },
  )
}

export function internalError(message = 'Erro interno do servidor.') {
  return NextResponse.json<ApiError>({ error: 'INTERNAL_ERROR', message }, { status: 500 })
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 })
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}
