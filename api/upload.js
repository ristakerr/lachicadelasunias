import { handler, json } from '../server/auth.js'
import { saveImage } from '../server/store.js'

const MAX = 4 * 1024 * 1024 // el panel achica las fotos antes de subirlas; esto es solo un tope
const MAGIC = { 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47], 'image/webp': [0x52, 0x49, 0x46, 0x46] }

// Sube una foto (el cuerpo del pedido es la imagen tal cual)
export const POST = handler(async (request) => {
  const type = (request.headers.get('content-type') || '').split(';')[0]
  if (!MAGIC[type]) return json({ error: 'Solo se aceptan fotos JPG, PNG o WebP' }, 415)
  const bytes = Buffer.from(await request.arrayBuffer())
  if (!bytes.length || bytes.length > MAX) return json({ error: 'La foto es demasiado grande (máx. 4 MB)' }, 413)
  if (!MAGIC[type].every((b, i) => bytes[i] === b)) return json({ error: 'El archivo no es una imagen válida' }, 415)
  const url = await saveImage(bytes, type)
  return json({ url })
})
