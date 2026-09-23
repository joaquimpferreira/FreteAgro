// app/(auth)/login.tsx
// US1: Driver login.
// Reads frotaNome from MMKV (persisted during account activation).
// Calls mobileAuth.signIn — never imports the Supabase client directly (constitution M-II).

import { useState, useEffect } from 'react'
import { View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import Animated from 'react-native-reanimated'
import { useRouter } from 'expo-router'
import { MMKV } from 'react-native-mmkv'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '../../components/ui/Text'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { Banner } from '../../components/ui/Banner'
import { shape, space } from '../../lib/theme'
import { makeStyles, useTheme } from '../../lib/theme/ThemeProvider'
import { reveal } from '../../lib/theme/motion'
import * as mobileAuth from '../../lib/auth/mobileAuth'

const storage = new MMKV({ id: 'app_prefs' })

export default function LoginScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const styles = useStyles()
  const [frotaNome, setFrotaNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = storage.getString('frota_nome')
    if (stored) setFrotaNome(stored)
  }, [])

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Preencha o e-mail e a senha para entrar.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await mobileAuth.signIn(email.trim(), password)
      router.replace('/(app)/')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Não foi possível entrar. Tente novamente.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={reveal(0)} style={styles.header}>
          <View style={styles.mark}>
            <Ionicons name="bus" size={32} color={colors.onPrimaryFill} accessible={false} />
          </View>
          <Text role="headlineMedium">FreteAgro</Text>
          <Text role="bodyLarge" tone="variant" style={styles.centered}>
            {frotaNome !== '' ? frotaNome : 'Entre para registrar suas viagens'}
          </Text>
        </Animated.View>

        <Animated.View entering={reveal(1)} style={styles.form}>
          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="seu@email.com"
            returnKeyType="next"
          />
          <TextField
            label="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            placeholder="Sua senha"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {error !== '' && <Banner message={error} />}

          <Button
            label="Entrar"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            prominent
          />
        </Animated.View>

        <Animated.View entering={reveal(2)}>
          <Text role="bodySmall" tone="faint" style={styles.centered}>
            Sua conta é criada pelo dono da frota. Se você ainda não tem acesso, peça o
            convite a ele pelo WhatsApp.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const useStyles = makeStyles(({ colors }) => ({
  screen: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.xxxl,
    gap: space.xxl,
  },
  header: {
    alignItems: 'center',
    gap: space.sm,
  },
  mark: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shape.large,
    backgroundColor: colors.primaryFill,
    marginBottom: space.sm,
  },
  centered: {
    textAlign: 'center',
  },
  form: {
    gap: space.lg,
  },
}))
