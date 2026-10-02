// TEMPORAL: diagnóstico de arranque (no expone valores de variables)
export default async function handler(req, res) {
  if (req.url.includes('direct')) { const m = await import('./auth.js'); try { return await m.default(req, res) } catch (e) { res.statusCode = 200; return res.end('THROWN: ' + String(e && e.stack || e)) } }
  const out = { node: process.version, env: { ADMIN_USER: !!process.env.ADMIN_USER, ADMIN_PASSWORD: !!process.env.ADMIN_PASSWORD, BLOB: !!process.env.BLOB_READ_WRITE_TOKEN, VERCEL: process.env.VERCEL }, mods: {} }
  for (const m of ['../server/auth.js', '../server/node.js', '../server/store.js', '../src/content/schema.js', './content.js', './upload.js']) {
    try { await import(m); out.mods[m] = 'ok' } catch (e) { out.mods[m] = String(e && e.stack || e).slice(0, 600) }
  }
  try {
    const { default: login } = await import('./auth.js')
    const fake = { statusCode: 0, h: {}, setHeader(k, v) { this.h[k] = v }, end(b) { this.body = String(b) } }
    await login(req, fake)
    out.headerNames = Object.keys(req.headers)
    out.loginGet = { status: fake.statusCode, body: fake.body }
  } catch (e) { out.loginGet = String(e && e.stack || e).slice(0, 800) }
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(out, null, 2))
}
