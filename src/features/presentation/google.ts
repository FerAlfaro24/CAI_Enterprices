import { ApiError } from '../local-access/api'

let nonce = ''
export async function presentationGoogle<T>(action: string, method = 'GET', input?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch('/api/presentation-google?action=' + action, {
      method, credentials: 'same-origin', cache: 'no-store',
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      body: method === 'POST' ? JSON.stringify(action === 'signin' ? { ...(input as object), nonce } : input ?? {}) : undefined,
      signal: AbortSignal.timeout(15_000),
    })
  } catch { throw new ApiError(0, 'No pudimos conectar con el acceso de Google. Inténtalo de nuevo.') }
  let result: { error?: string; nonce?: string; verified?: boolean; destination?: string }
  try { result = await response.json() } catch { throw new ApiError(response.status, 'Google está disponible en la presentación pública. Abre cai-enterprices.vercel.app.') }
  if (!response.ok || result.error) throw new ApiError(response.status, result.error ?? 'No pudimos confirmar la cuenta con Google.')
  if (action === 'signin' && (result.verified !== true || result.destination !== '/community')) throw new ApiError(502, 'No pudimos confirmar la cuenta con Google.')
  if (action === 'challenge') nonce = result.nonce ?? ''
  if (action === 'signin' || action === 'logout') nonce = ''
  return result as T
}
