// __tests__/hooks/useConectividade.test.ts
// T065 — Unit tests for hooks/useConectividade.ts
// expo-network is mocked; AppState is spied on to inject listener callbacks.

import { renderHook, act } from '@testing-library/react-native'
import { AppState, type AppStateStatus } from 'react-native'
import * as Network from 'expo-network'
import { useConectividade } from '../../hooks/useConectividade'

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(),
  // NetworkStateType stub — useConectividade only reads `isConnected`, but we keep
  // the enum for completeness so tests don't fail on import-time access.
  NetworkStateType: {
    WIFI: 'WIFI',
    CELLULAR: 'CELLULAR',
    BLUETOOTH: 'BLUETOOTH',
    ETHERNET: 'ETHERNET',
    NONE: 'NONE',
    UNKNOWN: 'UNKNOWN',
    VPNTUNNEL: 'VPNTUNNEL',
  },
}))

const mockGetNetworkStateAsync = jest.mocked(Network.getNetworkStateAsync)

describe('useConectividade', () => {
  let capturedListener: ((state: AppStateStatus) => void) | undefined
  let mockRemove: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    capturedListener = undefined
    mockRemove = jest.fn()

    jest.spyOn(AppState, 'addEventListener').mockImplementation(
      (_event, listener) => {
        capturedListener = listener as (state: AppStateStatus) => void
        return { remove: mockRemove } as ReturnType<
          typeof AppState.addEventListener
        >
      },
    )
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('returns isConnected: true when network is available', async () => {
    mockGetNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: Network.NetworkStateType.WIFI,
    })

    const { result } = renderHook(() => useConectividade())

    await act(async () => {})

    expect(result.current.isConnected).toBe(true)
  })

  it('returns isConnected: false when network is unavailable', async () => {
    mockGetNetworkStateAsync.mockResolvedValue({
      isConnected: false,
      isInternetReachable: false,
      type: Network.NetworkStateType.NONE,
    })

    const { result } = renderHook(() => useConectividade())

    await act(async () => {})

    expect(result.current.isConnected).toBe(false)
  })

  it('updates state when AppState becomes active (network state listener fires)', async () => {
    // Initial state: connected
    mockGetNetworkStateAsync.mockResolvedValueOnce({
      isConnected: true,
      isInternetReachable: true,
      type: Network.NetworkStateType.WIFI,
    })

    const { result } = renderHook(() => useConectividade())
    await act(async () => {})

    expect(result.current.isConnected).toBe(true)

    // App resumes from background — simulate going offline
    mockGetNetworkStateAsync.mockResolvedValueOnce({
      isConnected: false,
      isInternetReachable: false,
      type: Network.NetworkStateType.NONE,
    })

    await act(async () => {
      capturedListener?.('active')
    })

    expect(result.current.isConnected).toBe(false)
  })

  it('registers AppState listener on mount', async () => {
    mockGetNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: Network.NetworkStateType.WIFI,
    })

    renderHook(() => useConectividade())

    expect(AppState.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    )
  })

  it('removes AppState listener on unmount', async () => {
    mockGetNetworkStateAsync.mockResolvedValue({
      isConnected: true,
      isInternetReachable: true,
      type: Network.NetworkStateType.WIFI,
    })

    const { unmount } = renderHook(() => useConectividade())
    unmount()

    expect(mockRemove).toHaveBeenCalled()
  })
})
