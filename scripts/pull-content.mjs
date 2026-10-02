// Antes del build: baja la última versión publicada desde el panel y la deja en
// src/content/current.json, que es lo que lee el sitio.
// Si todavía no se publicó nada, usa src/content/default.js.
// Si Vercel Blob está configurado pero no responde, el build falla a propósito:
// así Vercel deja online la versión anterior en vez de volver al contenido por defecto.
import { writeFile } from 'node:fs/promises'
import { getLatest, usingBlob } from '../server/store.js'
import { normalize, DEFAULT } from '../src/content/schema.js'

let latest = null
try {
  latest = await getLatest()
} catch (e) {
  if (usingBlob() || process.env.VERCEL) { console.error('No pude leer el contenido del panel:', e.message); process.exit(1) }
}
const data = { id: latest?.id || 'default', savedAt: latest?.savedAt || null, content: normalize(latest?.content || DEFAULT) }
await writeFile(new URL('../src/content/current.json', import.meta.url), JSON.stringify(data, null, 2))
console.log(`Contenido: ${data.id}${usingBlob() ? ' (Vercel Blob)' : latest ? ' (local)' : ''}`)
