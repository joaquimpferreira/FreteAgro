// lib/utils/createId.ts
// UUID v4 generator that works in all JS environments (Hermes, Node, browser).
// Does not require native modules or Web Crypto API.
export function createId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
