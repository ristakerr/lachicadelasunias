import { handler, json, checkPassword, sessionCookie, clearCookie, isLogged, password } from '../server/auth.js'

// ¿Hay sesión abierta?
const GET = handler(async (request) => {
  password() // avisa si falta configurar la contraseña
  return json({ logged: isLogged(request) })
}, { auth: false })

// Entrar
const POST = handler(async (request) => {
  const body = await request.json().catch(() => ({}))
  if (!checkPassword(body.user, body.password)) {
    await new Promise((r) => setTimeout(r, 900)) // frena intentos a lo bruto
    return json({ error: 'Usuario o contraseña incorrectos' }, 401)
  }
  return json({ ok: true }, 200, { 'set-cookie': sessionCookie(request) })
}, { auth: false })

// Salir
const DELETE = handler(async () => json({ ok: true }, 200, { 'set-cookie': clearCookie() }), { auth: false })

import { toNode } from '../server/node.js'
export default toNode({ GET,POST,DELETE })
