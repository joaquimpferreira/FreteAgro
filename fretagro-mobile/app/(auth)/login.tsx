// app/(auth)/login.tsx
// US1: Driver login screen.
// Reads frotaNome from MMKV (persisted during account activation in ativar.tsx).
// Calls mobileAuth.signIn — never imports Supabase client directly (constitution M-II).

import { useState, useEffect } from 'react'
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { MMKV } from 'react-native-mmkv'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import * as mobileAuth from '../../lib/auth/mobileAuth'

const storage = new MMKV({ id: 'app_prefs' })

export default function LoginScreen() {
  const router = useRouter()
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
      setError('Preencha e-mail e senha.')
      return
    }
    setError('')
    setLoading(true)
    try {
      await mobileAuth.signIn(email.trim(), password)
      router.replace('/(app)/')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erro ao fazer login. Tente novamente.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        <View className="gap-8">
          {/* Header */}
          <View className="items-center gap-2">
            <Text className="text-3xl font-bold text-white">FreteAgro</Text>
            {frotaNome ? (
              <Text className="text-base text-gray-400">{frotaNome}</Text>
            ) : null}
            <Text className="text-sm text-gray-500 mt-1">
              Faça login para continuar
            </Text>
          </View>

          {/* Form */}
          <View className="gap-4">
            <Input
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="seu@email.com"
            />
            <Input
              label="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="••••••••"
            />
            {error ? (
              <Text className="text-sm text-red-500 text-center">{error}</Text>
            ) : null}
            <Button
              label="Entrar"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
