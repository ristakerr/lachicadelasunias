// Login del panel: una sola contraseña (variable ADMIN_PASSWORD en Vercel).
// Al entrar se entrega una cookie firmada (HMAC) que dura 14 días.
// Si cambiás la contraseña en Vercel, todas las sesiones abiertas se cierran solas.
import { createHmac, timingSafeEqual, createHash } from 'node:crypto'

const COOKIE = 'unias_s'
const DAYS = 14
const DEV_PASSWORD = 'unias-local'

export function password() {
  const p = process.env.ADMIN_PASSWORD
  if (p) return p
  if (process.env.VERCEL) throw Object.assign(new Error('Falta la variable ADMIN_PASSWORD en Vercel.'), { status: 500 })
  return DEV_PASSWORD // solo en tu compu, para probar
}

const key = () => createHash('sha256').update(`unias|${password()}|${process.env.SESSION_SECRET || ''}`).digest()
const sign = (v) => createHmac('sha256', key()).update(v).digest('base64url')
const same = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y) }

export function checkPassword(input) {
  const a = createHash('sha256').update(String(input || '')).digest()
  const b = createHash('sha256').update(password()).digest()
  return timingSafeEqual(a, b)
}

export function sessionCookie(request) {
  const exp = Date.now() + DAYS * 864e5
  const token = `${exp}.${sign(String(exp))}`
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `${COOKIE}=${token}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=${DAYS * 86400}${secure}`
}
export const clearCookie = () => `${COOKIE}=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0`

export function isLogged(request) {
  const raw = (request.headers.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='))
  if (!raw) return false
  const [exp, sig] = raw.slice(COOKIE.length + 1).split('.')
  return !!exp && !!sig && Number(exp) > Date.now() && same(sig, sign(exp))
}

// Los pedidos que cambian algo tienen que venir del propio sitio (protección CSRF)
export function sameOrigin(request) {
  const origin = request.headers.get('origin')
  return !origin || origin === new URL(request.url).origin
}

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } })

// Envuelve un handler: errores prolijos y, si hace falta, exige sesión
export const handler = (fn, { auth = true } = {}) => async (request) => {
  try {
    if (request.method !== 'GET' && !sameOrigin(request)) return json({ error: 'Origen no permitido' }, 403)
    if (auth && !isLogged(request)) return json({ error: 'Tu sesión venció. Volvé a entrar.' }, 401)
    return await fn(request)
  } catch (e) {
    console.error(e)
    return json({ error: e.status ? e.message : 'Algo falló en el servidor. Probá de nuevo en un rato.' }, e.status || 500)
  }
}
