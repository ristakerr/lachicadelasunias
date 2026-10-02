// Después de guardar, regenera el sitio.
// En Vercel: llama al Deploy Hook (variable DEPLOY_HOOK_URL). Vercel hace un build nuevo,
// que baja el contenido recién guardado y lo prerenderiza (SEO y vista previa de WhatsApp al día).
// En tu compu: reescribe src/content/current.json y Vite recarga la página sola.
export async function triggerDeploy() {
  const hook = process.env.DEPLOY_HOOK_URL
  if (hook) {
    if (!/^https:\/\/api\.vercel\.com\/v1\/integrations\/deploy\//.test(hook)) return { deploy: 'error', detail: 'DEPLOY_HOOK_URL no parece un Deploy Hook de Vercel' }
    const r = await fetch(hook, { method: 'POST' })
    return r.ok ? { deploy: 'ok' } : { deploy: 'error', detail: `Vercel respondió ${r.status}` }
  }
  if (process.env.VERCEL) return { deploy: 'missing' }
  const { execFile } = await import('node:child_process')
  await new Promise((ok, fail) => execFile(process.execPath, ['scripts/pull-content.mjs'], (e) => (e ? fail(e) : ok())))
  return { deploy: 'local' }
}
