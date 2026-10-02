// Adaptador: las funciones están escritas con Request/Response estándar,
// y Vercel las llama con el formato clásico (req, res) de Node.
export const toNode = (methods) => async (req, res) => {
  const fn = methods[req.method]
  if (!fn) { res.statusCode = 405; return res.end() }
  const chunks = []
  if (!['GET', 'HEAD'].includes(req.method)) for await (const c of req) chunks.push(c)
  const proto = req.headers['x-forwarded-proto'] || 'https'
  const url = new URL(req.url, `${proto}://${req.headers['x-forwarded-host'] || req.headers.host}`)
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) if (v != null) headers.set(k, Array.isArray(v) ? v.join(', ') : String(v))
  const request = new Request(url, { method: req.method, headers, body: chunks.length ? Buffer.concat(chunks) : undefined })
  const response = await fn(request)
  res.statusCode = response.status
  response.headers.forEach((v, k) => res.setHeader(k, v))
  res.end(Buffer.from(await response.arrayBuffer()))
}
