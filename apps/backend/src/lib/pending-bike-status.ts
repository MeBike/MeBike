type PendingMessage = {
  data: string
  expiresAt: number
}

const TTL_MS = 30_000

const store = new Map<string, PendingMessage[]>()

export function enqueuePendingBikeStatus(userId: string, data: string, ttlMs: number = TTL_MS) {
  if (!userId) return
  const expiresAt = Date.now() + ttlMs
  const messages = store.get(userId) ?? []
  messages.push({ data, expiresAt })
  store.set(userId, messages)
}

export function drainPendingBikeStatus(userId: string): string[] {
  const now = Date.now()
  const messages = store.get(userId) ?? []
  const validMessages = messages.filter((item) => item.expiresAt > now)
  store.delete(userId)
  return validMessages.map((item) => item.data)
}
