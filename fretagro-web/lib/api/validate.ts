// lib/api/validate.ts — reusable Zod validation wrapper for Route Handlers
// Returns a 422 with field-level errors if the payload is invalid.
// Principle VI: all user inputs MUST be sanitised with Zod before DB queries.

import { type ZodSchema, ZodError } from 'zod'
import { validationError } from './errors'

type ValidationResult<T> =
  | { data: T; error: null }
  | { data: null; error: ReturnType<typeof validationError> }

/**
 * Validates a JSON body from a Route Handler Request against a Zod schema.
 * Returns { data } on success or { error } (422 NextResponse) on failure.
 *
 * @example
 * const { data, error } = await validateBody(req, mySchema)
 * if (error) return error
 * // data is now fully typed
 */
export async function validateBody<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<ValidationResult<T>> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return {
      data: null,
      error: validationError({ _root: 'Corpo da requisição não é um JSON válido.' }),
    }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    return {
      data: null,
      error: validationError(formatZodErrors(result.error)),
    }
  }

  return { data: result.data, error: null }
}

/**
 * Validates URLSearchParams against a Zod schema.
 * Useful for validating query params on GET endpoints.
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>,
): ValidationResult<T> {
  const raw = Object.fromEntries(searchParams.entries())
  const result = schema.safeParse(raw)
  if (!result.success) {
    return { data: null, error: validationError(formatZodErrors(result.error)) }
  }
  return { data: result.data, error: null }
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function formatZodErrors(err: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  for (const issue of err.issues) {
    const key = issue.path.join('.') || '_root'
    if (!formatted[key]) formatted[key] = []
    formatted[key].push(issue.message)
  }
  return formatted
}
