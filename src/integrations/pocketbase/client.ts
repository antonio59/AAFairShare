import PocketBase from 'pocketbase'

let client: PocketBase | null = null
let clientPromise: Promise<PocketBase> | null = null

const DEFAULT_PB_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090'

export async function getPocketBase(): Promise<PocketBase> {
  if (client) return client
  if (!clientPromise) {
    clientPromise = (async () => {
      const pb = new PocketBase(DEFAULT_PB_URL)
      client = pb
      return pb
    })()
  }
  return clientPromise
}

export async function isOnline(): Promise<boolean> {
  try {
    const url = `${DEFAULT_PB_URL}/api/health`
    const res = await fetch(url, { method: 'GET' })
    return res.ok
  } catch (_) {
    return false
  }
}

export function cleanupAuthState(): void {
  if (client) {
    try {
      client.authStore.clear()
    } catch (_) {}
  }
  try {
    localStorage.removeItem('pocketbase_auth')
  } catch (_) {}
}

export async function forceSignOut(): Promise<void> {
  const pb = await getPocketBase()
  try {
    pb.authStore.clear()
  } catch (_) {}
}

export default getPocketBase
