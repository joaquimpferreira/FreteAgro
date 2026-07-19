// components/despesas/FotoNota.tsx
// Optional receipt photo capture component.
// On tap: calls capturarNota.ts (on-demand camera permission — constitution M-Camera).
// Shows thumbnail when a photo is captured, or a placeholder icon otherwise.
// Parent forms can submit without a photo (optional).
// Layer: components — imports from lib/camera and components/ui only.

import { Pressable, View, Text, Image, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { capturarNota, PermissionDeniedError } from '../../lib/camera/capturarNota'

interface FotoNotaProps {
  frotaId: string
  freteId: string
  /** Called with the storage path after a successful upload, or null to clear. */
  onFoto: (storagePath: string | null) => void
  /** Current storage path (controlled). */
  storagePath?: string | null
}

export function FotoNota({ frotaId, freteId, onFoto, storagePath }: FotoNotaProps) {
  const [localUri, setLocalUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePress() {
    setError(null)
    setLoading(true)
    try {
      const path = await capturarNota({ frotaId, freteId })
      if (path !== null) {
        // Store the local URI for immediate thumbnail display
        setLocalUri(path)
        onFoto(path)
      }
    } catch (err) {
      if (err instanceof PermissionDeniedError) {
        setError('Permissão de câmera negada. Habilite nas configurações.')
      } else {
        setError('Não foi possível salvar a foto. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const hasPhoto = storagePath != null

  return (
    <View className="gap-1">
      <Pressable
        onPress={handlePress}
        disabled={loading}
        className="min-h-[44px] bg-surface border border-surface rounded-xl items-center justify-center overflow-hidden"
        style={hasPhoto ? { height: 160 } : { height: 56 }}
      >
        {loading ? (
          <ActivityIndicator color="#22C55E" />
        ) : hasPhoto && localUri ? (
          <Image
            source={{ uri: localUri }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-row items-center gap-2 px-4">
            <Ionicons name="camera-outline" size={20} color="#6b7280" />
            <Text className="text-gray-400 text-sm">
              {hasPhoto ? 'Foto adicionada — toque para substituir' : 'Foto da nota (opcional)'}
            </Text>
          </View>
        )}
      </Pressable>
      {error && (
        <Text className="text-sm text-red-500">{error}</Text>
      )}
    </View>
  )
}
