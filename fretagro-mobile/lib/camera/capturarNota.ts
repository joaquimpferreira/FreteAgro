// lib/camera/capturarNota.ts
// Camera and upload helper for receipt photos.
// Layer: lib — imports from lib/supabase only; NO imports from hooks/, components/, or app/.
//
// IMPORTANT:
//   - Camera permission is requested on-demand here, never at app launch (constitution M-Camera).
//   - The Supabase Storage PATH (e.g. 'recibos/{frotaId}/{freteId}/{uuid}.jpg') is returned, NOT a signed URL.
//     Signed URLs expire; storage paths are permanent and safe to store in the database.
//     Signed URLs are generated at display time via:
//       supabase.storage.from('recibos').createSignedUrl(path, 3600)

import * as ImagePicker from 'expo-image-picker'
import { MediaTypeOptions } from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { createId } from '../utils/createId'
import { supabase } from '../supabase/client'

export class PermissionDeniedError extends Error {
  constructor() {
    super('Permissão de câmera negada')
    this.name = 'PermissionDeniedError'
  }
}

export interface CapturarNotaParams {
  frotaId: string
  freteId: string
}

/**
 * Opens the camera on-demand, compresses the captured image, and uploads it to
 * the private 'recibos' bucket.
 *
 * @returns The Supabase Storage path (NOT a signed URL).
 *          Returns null if the user cancelled without taking a photo.
 * @throws  PermissionDeniedError if camera permission is denied.
 */
export async function capturarNota(params: CapturarNotaParams): Promise<string | null> {
  // 1. Request permission on-demand (never at app launch — constitution M-Camera)
  const { status } = await ImagePicker.requestCameraPermissionsAsync()
  if (status !== 'granted') {
    throw new PermissionDeniedError()
  }

  // 2. Launch camera
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.7,
  })

  if (result.canceled) {
    return null
  }

  const uri = result.assets[0].uri

  // 3. Compress: resize to max 800×800, quality 0.7
  const compressed = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 800, height: 800 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
  )

  // 4. Fetch the image as a Blob for upload
  const response = await fetch(compressed.uri)
  const blob = await response.blob()

  // 5. Build a unique storage path
  const uuid = createId()
  const storagePath = `recibos/${params.frotaId}/${params.freteId}/${uuid}.jpg`

  // 6. Upload to private 'recibos' bucket
  const { error } = await supabase.storage
    .from('recibos')
    .upload(storagePath, blob, {
      contentType: 'image/jpeg',
      upsert: false,
    })

  if (error) {
    throw new Error(`Falha ao fazer upload da foto: ${error.message}`)
  }

  // Return the storage path — NOT a signed URL
  return storagePath
}
