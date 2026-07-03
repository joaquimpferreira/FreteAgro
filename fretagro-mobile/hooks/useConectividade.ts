// hooks/useConectividade.ts
// Returns real-time network connectivity status.
// expo-network v6 does not expose a listener API, so we poll on mount
// and on every AppState 'active' transition (app returned to foreground).

import { useEffect, useRef, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import * as Network from 'expo-network'

interface ConectividadeState {
  isConnected: boolean
}

export function useConectividade(): ConectividadeState {
  const [isConnected, setIsConnected] = useState(true)

  async function checkConnectivity() {
    const state = await Network.getNetworkStateAsync()
    setIsConnected(state.isConnected ?? false)
  }

  useEffect(() => {
    checkConnectivity()

    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          checkConnectivity()
        }
      },
    )

    return () => {
      subscription.remove()
    }
  }, [])

  return { isConnected }
}
