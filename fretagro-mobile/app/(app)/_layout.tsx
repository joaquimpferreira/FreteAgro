// app/(app)/_layout.tsx
// Authenticated app shell — tab navigator for all main driver screens.
// Guards against unauthenticated access; redirects to login if no session.
// TODO(T043): call useSync on mount and on AppState foreground event

import { useEffect, useState } from 'react'
import { Tabs, Redirect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as mobileAuth from '../../lib/auth/mobileAuth'

export default function AppLayout() {
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    mobileAuth.getSession().then((session) => {
      setHasSession(session != null)
      setSessionChecked(true)
    }).catch(() => {
      setHasSession(false)
      setSessionChecked(true)
    })
  }, [])

  if (!sessionChecked) return null

  if (!hasSession) {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#161616', borderTopColor: '#1f1f1f' },
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#6b7280',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="historico"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="acerto"
        options={{
          title: 'Acerto',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}
