// Dónde se guarda el contenido y las fotos.
// - En Vercel: Vercel Blob (necesita BLOB_READ_WRITE_TOKEN, que Vercel crea solo al conectar el store).
// - En tu compu (npm run dev): una carpeta .cms-local/, para probar el panel sin internet.
// Cada vez que se publica se crea un archivo nuevo cms/content-<fecha>.json: así queda
// historial y nunca hay problemas de caché con versiones viejas.
import { mkdir, readFile, readdir, writeFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

const KEEP = 30 // versiones de contenido que se guardan
const LOCAL = join(process.cwd(), '.cms-local')
export const usingBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN

function assertConfigured() {
  if (!usingBlob() && process.env.VERCEL) throw Object.assign(new Error('Falta conectar Vercel Blob al proyecto (Storage → Blob).'), { status: 500 })
}

const stamp = () => new Date().toISOString().replace(/[-:.]/g, '')

export async function getLatest() {
  assertConfigured()
  if (usingBlob()) {
    const { list } = await import('@vercel/blob')
    const { blobs } = await list({ prefix: 'cms/content-', limit: 1000 })
    if (!blobs.length) return null
    blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    const res = await fetch(blobs[0].url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`No pude leer el contenido guardado (${res.status})`)
    return { id: blobs[0].pathname, content: await res.json(), savedAt: blobs[0].uploadedAt }
  }
  const files = (await readdir(LOCAL).catch(() => [])).filter((f) => f.startsWith('content-')).sort()
  if (!files.length) return null
  const f = files.at(-1)
  return { id: `cms/${f}`, content: JSON.parse(await readFile(join(LOCAL, f), 'utf-8')), savedAt: (await stat(join(LOCAL, f))).mtime.toISOString() }
}

export async function saveContent(content) {
  assertConfigured()
  const name = `content-${stamp()}.json`
  const body = JSON.stringify(content, null, 2)
  if (usingBlob()) {
    const { put, list, del } = await import('@vercel/blob')
    const r = await put(`cms/${name}`, body, { access: 'public', contentType: 'application/json', addRandomSuffix: true, cacheControlMaxAge: 60 })
    // limpieza: borra versiones muy viejas
    const { blobs } = await list({ prefix: 'cms/content-', limit: 1000 })
    const old = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(KEEP).map((b) => b.url)
    if (old.length) await del(old).catch(() => {})
    return { id: r.pathname }
  }
  await mkdir(LOCAL, { recursive: true })
  await writeFile(join(LOCAL, name), body)
  return { id: `cms/${name}` }
}

export async function saveImage(bytes, type) {
  assertConfigured()
  const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type]
  const name = `trabajo-${stamp()}.${ext}`
  if (usingBlob()) {
    const { put } = await import('@vercel/blob')
    // las fotos nunca se sobrescriben (nombre único), así que pueden quedar en caché un año
    const r = await put(`fotos/${name}`, bytes, { access: 'public', contentType: type, addRandomSuffix: true, cacheControlMaxAge: 31536000 })
    return r.url
  }
  await mkdir(join(LOCAL, 'fotos'), { recursive: true })
  await writeFile(join(LOCAL, 'fotos', name), bytes)
  return `/cms-local/fotos/${name}`
}

export const LOCAL_DIR = LOCAL
