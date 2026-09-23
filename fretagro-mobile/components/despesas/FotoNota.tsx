// components/despesas/FotoNota.tsx
// Optional receipt photo. Taps through to capturarNota.ts, which asks for the
// camera permission on demand (constitution M-Camera).
//
// The control states what it is for in words and what will happen if it is
// tapped, because "an icon in a dashed box" is a convention this app's driver
// does not have. Forms submit fine without a photo.
//
// Layer: components — imports from lib/camera and components/ui only.

import { useState } from 'react'
import { Pressable, View, Image, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '../ui/Text'
import { Banner } from '../ui/Banner'
import { capturarNota, PermissionDeniedError } from '../../lib/camera/capturarNota'
import { shape, space, touch } from '../../lib/theme'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'

interface FotoNotaProps {
  frotaId: string
  freteId: string
  /** Called with the storage path after a successful upload, or null to clear. */
  onFoto: (storagePath: string | null) => void
  /** Current storage path (controlled). */
  storagePath?: string | null
}

export function FotoNota({ frotaId, freteId, onFoto, storagePath }: FotoNotaProps) {
  const { colors } = useTheme()
  const styles = useStyles()
  const [localUri, setLocalUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePress() {
    setError(null)
    setLoading(true)
    try {
      const path = await capturarNota({ frotaId, freteId })
      if (path !== null) {
        setLocalUri(path)
        onFoto(path)
      }
    } catch (err) {
      if (err instanceof PermissionDeniedError) {
        setError(
          'O app não tem permissão para usar a câmera. Libere em Ajustes do aparelho e tente de novo.',
        )
      } else {
        setError('Não foi possível salvar a foto. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const hasPhoto = storagePath != null

  return (
    <View style={styles.group}>
      <Text role="labelLarge" tone="variant">
        Foto da nota
      </Text>

      <Pressable
        onPress={handlePress}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel={
          hasPhoto ? 'Foto anexada. Toque para trocar a foto.' : 'Tirar foto da nota'
        }
        android_ripple={{ color: colors.onSurfaceVariant }}
        style={({ pressed }) => [
          styles.control,
          hasPhoto && styles.controlWithPhoto,
          pressed && styles.pressed,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : hasPhoto && localUri != null ? (
          <>
            <Image source={{ uri: localUri }} style={styles.image} resizeMode="cover" />
            <View style={styles.overlay}>
              <Ionicons name="camera" size={18} color={colors.onSurface} accessible={false} />
              <Text role="labelMedium">Trocar foto</Text>
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <Ionicons
              name={hasPhoto ? 'checkmark-circle' : 'camera-outline'}
              size={22}
              color={hasPhoto ? colors.primary : colors.onSurfaceVariant}
              accessible={false}
            />
            <Text role="bodyLarge" tone={hasPhoto ? 'default' : 'variant'}>
              {hasPhoto ? 'Foto anexada — toque para trocar' : 'Tirar foto da nota'}
            </Text>
          </View>
        )}
      </Pressable>

      {!hasPhoto && !loading && (
        <Text role="bodySmall" tone="faint">
          Opcional, mas é o que prova a despesa na hora do acerto.
        </Text>
      )}

      {error != null && <Banner message={error} />}
    </View>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  group: {
    gap: space.sm,
  },
  control: {
    minHeight: touch.actionHeight,
    borderRadius: shape.medium,
    borderWidth: 1,
    borderColor: colors.outline,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  controlWithPhoto: {
    height: 180,
    borderStyle: 'solid',
  },
  pressed: {
    opacity: 0.9,
  },
  placeholder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.base,
    paddingVertical: space.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: space.md,
    right: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: shape.full,
    backgroundColor: colors.surfaceContainerHighest,
  },
}))
