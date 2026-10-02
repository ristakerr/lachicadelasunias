// Limpia y valida el contenido que llega del panel. Lo usan el servidor (al guardar)
// y el build (al leer), así un dato roto nunca llega a romper el sitio.
// Toma como molde el contenido por defecto: cualquier campo que falte o tenga
// un tipo equivocado se completa con el valor de default.js.
import DEFAULT from './default.js'

const MAX_LIST = { promos: 12, galeria: 40, opiniones: 30, autoridad: 4, esencia: 8, franja: 4, 'hero.fotos': 3, 'reserva.turnos': 6 }
const MIN_LIST = { autoridad: 1, esencia: 1, promos: 1, galeria: 1, 'hero.fotos': 3, 'reserva.turnos': 1 }
const IMG_KEYS = new Set(['img', 'hero.fotos', 'galeria'])

// fotos: rutas del propio sitio o archivos subidos a Vercel Blob
export const isImage = (s) =>
  typeof s === 'string' && (/^\/[\w\-/.]+\.(jpe?g|png|webp|avif)$/i.test(s) && !s.includes('..')
    || /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[\w\-/.%]+$/i.test(s))

const text = (v, fb, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : fb)

function fix(value, model, path, key, inList = false) {
  if (Array.isArray(model)) {
    const item = model[0]
    let list = Array.isArray(value) ? value : model
    list = list.map((v) => fix(v, item, path, key, true)).filter((v) => v !== undefined && v !== '')
    list = list.slice(0, MAX_LIST[path] ?? 20)
    return list.length >= (MIN_LIST[path] ?? 0) ? list : model
  }
  if (model && typeof model === 'object') {
    const src = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
    const out = {}
    for (const k of Object.keys(model)) out[k] = fix(src[k], model[k], path ? `${path}.${k}` : k, k)
    return out
  }
  if (IMG_KEYS.has(key) || IMG_KEYS.has(path)) return isImage(value) ? value : (inList ? undefined : model)
  if (typeof model === 'boolean') return typeof value === 'boolean' ? value : model
  if (typeof model === 'number') {
    const n = typeof value === 'string' ? Number(value.replace(/[^\d]/g, '')) : value
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : model
  }
  const max = key === 'q' || path.endsWith('texto') || path === 'footer' || path === 'seo.description' ? 420 : 140
  return text(value, model, max)
}

export function normalize(input) {
  const c = fix(input, DEFAULT, '', '')
  c.contacto.whatsapp = c.contacto.whatsapp.replace(/\D/g, '').slice(0, 15) || DEFAULT.contacto.whatsapp
  c.contacto.instagram = c.contacto.instagram.replace(/^@|https?:\/\/(www\.)?instagram\.com\//g, '').replace(/[^\w.]/g, '') || DEFAULT.contacto.instagram
  if (!/^https:\/\/(www\.)?(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/.test(c.contacto.maps)) c.contacto.maps = DEFAULT.contacto.maps
  c.rating.score = /^\d([.,]\d)?$/.test(c.rating.score) ? c.rating.score.replace(',', '.') : DEFAULT.rating.score
  // una sola promo destacada como máximo
  let star = false
  c.promos.forEach((p) => { if (p.star && !star) star = true; else p.star = false })
  return c
}

export { money, igUrl, emphasis } from './format.js'
export { DEFAULT }
