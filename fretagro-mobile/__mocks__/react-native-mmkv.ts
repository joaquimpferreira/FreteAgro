/**
 * Manual Jest mock for react-native-mmkv.
 *
 * Provides an in-memory Map-backed MMKV implementation so unit tests can run
 * without the native module.  Each MMKV instance is keyed by its `id` option
 * (default: "default"), mirroring the real library behaviour.
 *
 * Usage in test files:
 *   jest.mock('react-native-mmkv')
 *
 * To clear state between tests:
 *   import { __clearAllMMKVStores } from 'react-native-mmkv'
 *   beforeEach(() => __clearAllMMKVStores())
 *
 * Or simply use the module's own public API to reset (e.g. dequeueAll / saveViagem(null))
 * in each test's beforeEach.
 */

const instanceStores: Record<string, Map<string, string>> = {}

function getStore(id: string): Map<string, string> {
  if (!instanceStores[id]) instanceStores[id] = new Map()
  return instanceStores[id]
}

export class MMKV {
  private storeId: string

  constructor(options?: { id?: string }) {
    this.storeId = options?.id ?? 'default'
    getStore(this.storeId) // ensure store exists
  }

  getString(key: string): string | undefined {
    return getStore(this.storeId).get(key)
  }

  set(key: string, value: string): void {
    getStore(this.storeId).set(key, value)
  }

  delete(key: string): void {
    getStore(this.storeId).delete(key)
  }

  contains(key: string): boolean {
    return getStore(this.storeId).has(key)
  }

  clearAll(): void {
    getStore(this.storeId).clear()
  }
}

/** Test helper: wipes every MMKV store across all instances. */
export function __clearAllMMKVStores(): void {
  for (const key of Object.keys(instanceStores)) {
    instanceStores[key].clear()
  }
}
