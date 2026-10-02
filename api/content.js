import { handler, json } from '../server/auth.js'
import { getLatest, saveContent } from '../server/store.js'
import { triggerDeploy } from '../server/deploy.js'
import { normalize, DEFAULT } from '../src/content/schema.js'

// Contenido actual para el panel
export const GET = handler(async () => {
  const latest = await getLatest()
  return json({ id: latest?.id || 'default', savedAt: latest?.savedAt || null, content: normalize(latest?.content || DEFAULT) })
})

// Guardar y publicar
export const POST = handler(async (request) => {
  const body = await request.json().catch(() => null)
  if (!body || typeof body.content !== 'object') return json({ error: 'Datos inválidos' }, 400)
  // si alguien publicó mientras editabas, no pisamos sus cambios sin avisar
  const latest = await getLatest()
  const current = latest?.id || 'default'
  if (!body.force && body.baseId && body.baseId !== current) {
    return json({ error: 'Alguien publicó cambios mientras editabas.', conflict: true, id: current }, 409)
  }
  const content = normalize(body.content)
  const { id } = await saveContent(content)
  const deploy = await triggerDeploy().catch((e) => ({ deploy: 'error', detail: e.message }))
  return json({ ok: true, id, content, ...deploy })
})
