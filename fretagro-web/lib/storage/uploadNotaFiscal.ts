// lib/storage/uploadNotaFiscal.ts — Nota fiscal photo upload to Supabase Storage
// FR-017: validates MIME type before accepting the file (Edge Case: reject corrupted/unsupported).
// Server-side only — uses service role client to bypass RLS for storage writes.
// SC-006: receipt files must be accessible within 10s (synchronous upload path).

import { createServerSupabaseClient } from '@/lib/db/supabase'

// Allowed MIME types for nota fiscal photos (FR-017 Edge Case)
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

// Max file size: 10 MB
const MAX_BYTES = 10 * 1024 * 1024

const BUCKET = 'notas-fiscais'

export interface UploadResult {
  url: string
  path: string
}

export interface UploadError {
  code: 'INVALID_MIME' | 'FILE_TOO_LARGE' | 'STORAGE_ERROR'
  message: string
}

export type UploadNotaFiscalResult =
  | { ok: true; data: UploadResult }
  | { ok: false; error: UploadError }

/**
 * Validates and uploads a nota fiscal photo to Supabase Storage.
 * Returns the public URL on success or a typed error on failure.
 *
 * @param file      File object from FormData
 * @param frotaId   Tenant scope — used to namespace the storage path
 * @param freteId   Freight identifier — used in the path for easy lookup
 */
export async function uploadNotaFiscal(
  file: File,
  frotaId: string,
  freteId: string,
): Promise<UploadNotaFiscalResult> {
  // 1. MIME validation (reject corrupted/unsupported — FR-017 Edge Case)
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_MIME',
        message: `Tipo de arquivo não suportado: ${file.type}. Use JPEG, PNG, WebP ou PDF.`,
      },
    }
  }

  // 2. Size check
  if (file.size > MAX_BYTES) {
    return {
      ok: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Limite: 10 MB.`,
      },
    }
  }

  // 3. Build a unique storage path: {frotaId}/{freteId}/{timestamp}-{sanitisedName}
  const sanitisedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
  const path = `${frotaId}/${freteId}/${Date.now()}-${sanitisedName}`

  // 4. Upload via service-role client (bypasses storage RLS; SC-006)
  const supabase = createServerSupabaseClient(true)
  const arrayBuffer = await file.arrayBuffer()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error('[uploadNotaFiscal] Storage error:', error)
    return {
      ok: false,
      error: { code: 'STORAGE_ERROR', message: 'Falha ao fazer upload do arquivo.' },
    }
  }

  // 5. Get the public URL
  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return {
    ok: true,
    data: { url: publicData.publicUrl, path },
  }
}
