// TEMPORAL: prueba de punta a punta del lado del servidor
import { checkPassword } from '../server/auth.js'
import { getLatest } from '../server/store.js'
import { put, del } from '@vercel/blob'
export default async function handler(req, res) {
  const out = {}
  try { out.loginOk = checkPassword('paolapalma', 'palta'); out.loginBad = checkPassword('paolapalma', 'x') } catch (e) { out.login = String(e) }
  try { const l = await getLatest(); out.latest = l ? l.id : null } catch (e) { out.latest = 'ERR ' + String(e) }
  try { const r = await put('diag/test.txt', 'ok', { access: 'public', addRandomSuffix: true }); out.put = r.pathname; await del(r.url); out.del = 'ok' } catch (e) { out.blob = 'ERR ' + String(e) }
  out.hook = !!process.env.DEPLOY_HOOK_URL
  res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(out))
}
