/** Una política por aplicación: las pruebas concurrentes no cambian process.env. */
export type CookiePolicy = { secure: boolean }
export const localCookies: CookiePolicy = { secure: false }

export function sessionCookieName(name: string, policy: CookiePolicy) {
  return policy.secure ? `__Host-${name}` : name
}

export function sessionCookie(name: string, value: string, seconds: number, policy: CookiePolicy) {
  return `${sessionCookieName(name, policy)}=${value}; HttpOnly; SameSite=Strict; Path=${policy.secure ? '/' : '/api/local'}; Max-Age=${seconds}${policy.secure ? '; Secure' : ''}`
}
