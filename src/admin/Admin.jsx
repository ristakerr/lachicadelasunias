import { useEffect, useMemo, useRef, useState } from 'react'
import { DEFAULT, money } from '../content/schema.js'

/* ---------- utilidades ---------- */
async function api(path, opts = {}) {
  const r = await fetch(`/api/${path}`, { credentials: 'same-origin', ...opts })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(d.error || `Error ${r.status}`), { status: r.status, data: d })
  return d
}
const postJson = (path, body) => api(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

function setIn(obj, path, value) {
  if (!path.length) return value
  const [k, ...rest] = path
  const copy = Array.isArray(obj) ? [...obj] : { ...obj }
  copy[k] = setIn(obj[k], rest, value)
  return copy
}
const getIn = (obj, path) => path.reduce((o, k) => o?.[k], obj)

// Achica la foto en el navegador (máx. 1600 px, JPG) antes de subirla: carga rápido y pesa poco
async function shrink(file) {
  let bmp
  try { bmp = await createImageBitmap(file) } catch { throw new Error('No pude abrir esa foto. Probá con un JPG o PNG.') }
  const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  return new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.85))
}
async function uploadPhoto(file) {
  const blob = await shrink(file)
  const { url } = await api('upload', { method: 'POST', headers: { 'content-type': 'image/jpeg' }, body: blob })
  return url
}

const SECTIONS = [
  ['promos', 'Promos y precios'],
  ['portada', 'Portada'],
  ['galeria', 'Galería'],
  ['opiniones', 'Opiniones'],
  ['numeros', 'Números'],
  ['define', 'Lo que nos define'],
  ['eventos', 'Eventos y reserva'],
  ['contacto', 'Contacto'],
  ['google', 'Google'],
]

/* ---------- controles ---------- */
function Field({ label, hint, value, onChange, multiline, max = 140, type = 'text', prefix, placeholder }) {
  const Tag = multiline ? 'textarea' : 'input'
  const len = String(value ?? '').length
  return (
    <label className="f">
      <span className="f-l">{label}{type === 'text' && len > max * 0.8 && <em className={len > max ? 'over' : ''}>{len}/{max}</em>}</span>
      <span className={`f-in${prefix ? ' has-pre' : ''}`}>
        {prefix && <i>{prefix}</i>}
        <Tag type={multiline ? undefined : type} value={value ?? ''} placeholder={placeholder} rows={multiline ? 3 : undefined}
          inputMode={type === 'price' ? 'numeric' : undefined}
          onChange={(e) => onChange(e.target.value)} />
      </span>
      {hint && <small>{hint}</small>}
    </label>
  )
}

function PriceField({ label, value, onChange }) {
  const [txt, setTxt] = useState(Number(value).toLocaleString('es-AR'))
  useEffect(() => { setTxt(Number(value).toLocaleString('es-AR')) }, [value])
  return (
    <label className="f">
      <span className="f-l">{label}</span>
      <span className="f-in has-pre"><i>$</i>
        <input inputMode="numeric" value={txt}
          onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 9); setTxt(d ? Number(d).toLocaleString('es-AR') : ''); onChange(Number(d || 0)) }} />
      </span>
    </label>
  )
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="tg">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="tg-s" aria-hidden="true" />{label}
    </label>
  )
}

function ItemTools({ i, n, move, remove, min = 0, h }) {
  return (
    <div className="tools">
      <button type="button" className="ib" onClick={() => move(i, -1)} disabled={i === 0} aria-label={h ? 'Mover antes' : 'Subir'}>{h ? '←' : '↑'}</button>
      <button type="button" className="ib" onClick={() => move(i, 1)} disabled={i === n - 1} aria-label={h ? 'Mover después' : 'Bajar'}>{h ? '→' : '↓'}</button>
      <button type="button" className="ib del" onClick={() => remove(i)} disabled={n <= min} aria-label="Borrar">✕</button>
    </div>
  )
}

// Lista editable genérica (promos, opiniones, etc.)
function List({ items, onChange, render, blank, max, min = 0, addLabel, title }) {
  const move = (i, d) => { const a = [...items]; [a[i], a[i + d]] = [a[i + d], a[i]]; onChange(a) }
  const remove = (i) => { if (confirm('¿Borrar este elemento?')) onChange(items.filter((_, j) => j !== i)) }
  const set = (i) => (k) => (v) => onChange(items.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
  return (
    <div className="list">
      {items.map((it, i) => (
        <div className="item" key={i}>
          <div className="item-h"><b>{title(it, i)}</b><ItemTools i={i} n={items.length} move={move} remove={remove} min={min} /></div>
          {render(it, set(i), i)}
        </div>
      ))}
      {items.length < max && <button type="button" className="add" onClick={() => onChange([...items, structuredClone(blank)])}>+ {addLabel}</button>}
    </div>
  )
}

/* ---------- fotos ---------- */
function Uploader({ onUploaded, multiple, children, className = 'add' }) {
  const ref = useRef()
  const [busy, setBusy] = useState(0)
  const [err, setErr] = useState('')
  const pick = async (e) => {
    const files = [...e.target.files]; e.target.value = ''
    setErr(''); setBusy(files.length)
    for (const f of files) {
      try { onUploaded(await uploadPhoto(f)) } catch (x) { setErr(x.message); if (x.status === 401) window.dispatchEvent(new Event('unias:logout')) }
      setBusy((b) => b - 1)
    }
  }
  return (
    <>
      <button type="button" className={className} disabled={busy > 0} onClick={() => ref.current.click()}>
        {busy ? `Subiendo${busy > 1 ? ` (${busy})` : ''}…` : children}
      </button>
      <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/*" multiple={multiple} hidden onChange={pick} />
      {err && <p className="err">{err}</p>}
    </>
  )
}

function PhotoPicker({ value, onChange, library, onAdd, label }) {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return
    const k = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open])
  return (
    <div className="pp">
      <span className="f-l">{label}</span>
      <button type="button" className="pp-cur" onClick={() => setOpen(true)}>
        <img src={value} alt="" /><span>Cambiar</span>
      </button>
      {open && (
        <div className="modal" role="dialog" aria-modal="true" aria-label="Elegir foto" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="modal-in">
            <div className="modal-h"><b>Elegí una foto</b><button type="button" className="ib" onClick={() => setOpen(false)} aria-label="Cerrar">✕</button></div>
            <div className="lib">
              {library.map((src) => (
                <button type="button" key={src} className={`lib-i${src === value ? ' on' : ''}`} onClick={() => { onChange(src); setOpen(false) }}>
                  <img src={src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
            <Uploader onUploaded={(url) => { onAdd(url); onChange(url); setOpen(false) }}>Subir foto nueva</Uploader>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- login ---------- */
function Login({ onOk, note }) {
  const [user, setUser] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const go = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { await postJson('login', { user, password: pw }); onOk() } catch (x) { setErr(x.message) }
    setBusy(false)
  }
  return (
    <main className="login">
      <form onSubmit={go} className="login-card">
        <p className="brand">La chica de las uñas</p>
        <h1>Panel</h1>
        {note && <p className="note">{note}</p>}
        <label className="f"><span className="f-l">Usuario</span>
          <span className="f-in"><input autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck="false" value={user} onChange={(e) => setUser(e.target.value)} autoFocus /></span>
        </label>
        <label className="f"><span className="f-l">Contraseña</span>
          <span className="f-in"><input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} /></span>
        </label>
        {err && <p className="err">{err}</p>}
        <button className="btn" disabled={!user || !pw || busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
      </form>
    </main>
  )
}

/* ---------- panel ---------- */
export default function Admin() {
  const [auth, setAuth] = useState('checking') // checking | out | in
  const [authNote, setAuthNote] = useState('')
  const [saved, setSaved] = useState(null) // { id, content }
  const [c, setC] = useState(null)
  const [extra, setExtra] = useState([]) // fotos subidas en esta sesión
  const [pub, setPub] = useState({ state: 'idle' }) // idle | saving | building | live | done | error
  const [loadErr, setLoadErr] = useState('')
  const [active, setActive] = useState('promos')

  const dirty = useMemo(() => !!c && !!saved && JSON.stringify(c) !== JSON.stringify(saved.content), [c, saved])

  const load = async () => {
    setLoadErr('')
    try { const d = await api('content'); setSaved(d); setC((cur) => cur && dirtyRef.current ? cur : d.content) } catch (x) {
      if (x.status === 401) setAuth('out'); else setLoadErr(x.message)
    }
  }
  const dirtyRef = useRef(false); dirtyRef.current = dirty

  useEffect(() => {
    api('login').then((d) => setAuth(d.logged ? 'in' : 'out')).catch((x) => { setAuth('out'); setAuthNote(x.message) })
    const out = () => { setAuth('out'); setAuthNote('Tu sesión venció. Entrá de nuevo: tus cambios siguen acá.') }
    window.addEventListener('unias:logout', out)
    return () => window.removeEventListener('unias:logout', out)
  }, [])
  useEffect(() => { if (auth === 'in') load() }, [auth]) // eslint-disable-line

  // aviso al cerrar la pestaña con cambios sin publicar
  useEffect(() => {
    const h = (e) => { if (dirtyRef.current) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [])

  // resalta en el menú la sección visible
  useEffect(() => {
    if (!c) return
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: '-30% 0px -60% 0px' })
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el) })
    return () => io.disconnect()
  }, [!!c])

  const set = (path) => (v) => setC((cur) => setIn(cur, path, v))
  const bind = (path) => ({ value: getIn(c, path), onChange: set(path) })

  const library = useMemo(() => {
    if (!c) return []
    const all = [...extra, ...c.galeria, ...c.hero.fotos, ...c.esencia.map((e) => e.img), ...DEFAULT.galeria]
    return [...new Set(all)]
  }, [c, extra])
  const addToLib = (url) => setExtra((x) => [url, ...x])

  const waitLive = async (id) => {
    const t0 = Date.now()
    while (Date.now() - t0 < 5 * 60e3) {
      await new Promise((r) => setTimeout(r, 6000))
      try {
        const v = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' }).then((r) => r.json())
        if (v.id === id) return setPub({ state: 'live' })
      } catch { /* sigue esperando */ }
    }
    setPub({ state: 'done', msg: 'Guardado. El sitio está tardando más de lo normal en actualizarse; revisá en unos minutos.' })
  }

  const publish = async (force = false) => {
    setPub({ state: 'saving' })
    try {
      const r = await postJson('content', { content: c, baseId: saved.id, force })
      setSaved({ id: r.id, content: r.content }); setC(r.content)
      if (r.deploy === 'ok') { setPub({ state: 'building' }); waitLive(r.id) }
      else if (r.deploy === 'local') setPub({ state: 'live', msg: 'Guardado en modo local. La página de prueba ya se actualizó.' })
      else if (r.deploy === 'missing') setPub({ state: 'error', msg: 'Se guardó, pero falta configurar DEPLOY_HOOK_URL en Vercel, así que el sitio no se actualiza solo.' })
      else setPub({ state: 'error', msg: `Se guardó, pero no pude regenerar el sitio (${r.detail || 'error'}). Probá publicar de nuevo.` })
    } catch (x) {
      if (x.status === 401) { setPub({ state: 'idle' }); window.dispatchEvent(new Event('unias:logout')); return }
      if (x.status === 409) {
        setPub({ state: 'idle' })
        if (confirm('Alguien publicó cambios mientras editabas (¿quizás desde otro dispositivo?).\n\nAceptar: publicar lo tuyo y reemplazar esos cambios.\nCancelar: no publicar todavía.')) publish(true)
        return
      }
      setPub({ state: 'error', msg: x.message })
    }
  }

  const logout = async () => {
    if (dirty && !confirm('Tenés cambios sin publicar. ¿Salir igual?')) return
    await api('login', { method: 'DELETE' }).catch(() => {})
    setC(null); setSaved(null); setAuthNote(''); setAuth('out')
  }

  if (auth === 'checking') return <main className="login"><p className="muted">Cargando…</p></main>
  if (auth === 'out') return <Login note={authNote} onOk={() => { setAuthNote(''); setAuth('in') }} />
  if (loadErr) return <main className="login"><div className="login-card"><p className="err">{loadErr}</p><button className="btn" onClick={load}>Reintentar</button></div></main>
  if (!c) return <main className="login"><p className="muted">Cargando contenido…</p></main>

  const busy = pub.state === 'saving'
  const status = busy ? 'Guardando…'
    : dirty ? 'Tenés cambios sin publicar'
    : pub.state === 'building' ? 'Publicado. Actualizando el sitio (≈1 minuto)…'
    : pub.state === 'live' ? (pub.msg || '¡Listo! Los cambios ya están online.')
    : pub.state === 'error' || pub.state === 'done' ? pub.msg
    : 'Todo publicado'

  return (
    <div className="app">
      <header className="top">
        <div className="top-in">
          <p className="brand">La chica de las uñas <span>Panel</span></p>
          <div className="top-a">
            <a href="/" target="_blank" rel="noopener">Ver sitio ↗</a>
            <button type="button" className="link" onClick={logout}>Salir</button>
          </div>
        </div>
        <nav className="tabs" aria-label="Secciones">
          {SECTIONS.map(([id, t]) => <a key={id} href={`#${id}`} className={active === id ? 'on' : ''}>{t}</a>)}
        </nav>
      </header>

      <main className="ed">
        <section id="promos" className="card">
          <h2>Promos y precios</h2>
          <Field label="Texto arriba de las promos" multiline max={420} {...bind(['promosIntro'])} />
          <List items={c.promos} onChange={set(['promos'])} max={12} min={1} addLabel="Agregar promo"
            blank={{ name: 'Nueva promo', price: 0, desc: '', star: false }}
            title={(p) => <>{p.name || 'Sin nombre'} <span className="pill">{money(p.price)}</span>{p.star && <span className="pill star">Destacada</span>}</>}
            render={(p, s) => (
              <>
                <div className="two"><Field label="Nombre" value={p.name} onChange={s('name')} /><PriceField label="Precio" value={p.price} onChange={s('price')} /></div>
                <Field label="Descripción" value={p.desc} onChange={s('desc')} />
                <Toggle label="Destacar como “La más pedida”" checked={p.star}
                  onChange={(v) => setC((cur) => ({ ...cur, promos: cur.promos.map((x) => ({ ...x, star: x === p ? v : (v ? false : x.star) })) }))} />
              </>
            )} />
          <p className="hint">La primera promo también aparece en la etiqueta de la portada. Las promos se usan en el formulario de reserva y en Google.</p>
        </section>

        <section id="portada" className="card">
          <h2>Portada</h2>
          <Field label="Etiqueta de arriba" {...bind(['hero', 'kicker'])} />
          <Field label="Título" hint="Poné una palabra entre *asteriscos* para resaltarla en rosa." {...bind(['hero', 'titulo'])} />
          <Field label="Texto" multiline max={420} {...bind(['hero', 'texto'])} />
          <Field label="Etiqueta flotante" {...bind(['hero', 'chip'])} />
          <div className="photos3">
            {c.hero.fotos.map((src, i) => <PhotoPicker key={i} label={['Izquierda', 'Centro', 'Derecha'][i]} value={src} onChange={set(['hero', 'fotos', i])} library={library} onAdd={addToLib} />)}
          </div>
          <div className="two">
            {c.franja.map((t, i) => <Field key={i} label={`Franja rosa · texto ${i + 1}`} value={t} onChange={set(['franja', i])} />)}
          </div>
        </section>

        <section id="galeria" className="card">
          <h2>Galería <span className="count">{c.galeria.length} fotos</span></h2>
          <p className="hint">Se muestran en la cinta de “Nuestros trabajos”. Ideal: fotos verticales.</p>
          <div className="gal">
            {c.galeria.map((src, i) => (
              <figure key={src + i} className="gal-i">
                <img src={src} alt="" loading="lazy" />
                <ItemTools h i={i} n={c.galeria.length} min={1}
                  move={(i, d) => { const a = [...c.galeria]; [a[i], a[i + d]] = [a[i + d], a[i]]; set(['galeria'])(a) }}
                  remove={(i) => confirm('¿Sacar esta foto de la galería?') && set(['galeria'])(c.galeria.filter((_, j) => j !== i))} />
              </figure>
            ))}
          </div>
          {c.galeria.length < 40 && <Uploader multiple onUploaded={(url) => { addToLib(url); setC((cur) => ({ ...cur, galeria: [...cur.galeria, url] })) }}>+ Subir fotos</Uploader>}
        </section>

        <section id="opiniones" className="card">
          <h2>Opiniones</h2>
          <div className="two">
            <Field label="Puntaje en Google" {...bind(['rating', 'score'])} placeholder="5.0" />
            <Field label="Cantidad de opiniones" {...bind(['rating', 'count'])} />
          </div>
          <List items={c.opiniones} onChange={set(['opiniones'])} max={30} addLabel="Agregar opinión"
            blank={{ q: '', n: '', m: 'Opinión en Google' }}
            title={(o) => o.n || 'Nueva opinión'}
            render={(o, s) => (
              <>
                <Field label="Opinión" multiline max={420} value={o.q} onChange={s('q')} />
                <div className="two"><Field label="Nombre" value={o.n} onChange={s('n')} /><Field label="Detalle" value={o.m} onChange={s('m')} placeholder="Clienta hace 5 años" /></div>
              </>
            )} />
        </section>

        <section id="numeros" className="card">
          <h2>Números</h2>
          <p className="hint">Las tarjetas grandes debajo de la portada.</p>
          <List items={c.autoridad} onChange={set(['autoridad'])} max={4} min={1} addLabel="Agregar número"
            blank={{ n: '', t: '', d: '', stars: false }}
            title={(x) => `${x.n} ${x.t}`.trim() || 'Nuevo'}
            render={(x, s) => (
              <>
                <div className="two"><Field label="Número" value={x.n} onChange={s('n')} placeholder="+20" /><Field label="Título" value={x.t} onChange={s('t')} /></div>
                <Field label="Detalle" value={x.d} onChange={s('d')} />
                <Toggle label="Mostrar estrellas" checked={x.stars} onChange={s('stars')} />
              </>
            )} />
        </section>

        <section id="define" className="card">
          <h2>Lo que nos define</h2>
          <List items={c.esencia} onChange={set(['esencia'])} max={8} min={1} addLabel="Agregar tarjeta"
            blank={{ t: 'Nueva', d: '', img: c.galeria[0] }}
            title={(x) => x.t || 'Sin título'}
            render={(x, s) => (
              <div className="row-img">
                <PhotoPicker label="Foto" value={x.img} onChange={s('img')} library={library} onAdd={addToLib} />
                <div><Field label="Título" value={x.t} onChange={s('t')} /><Field label="Texto" value={x.d} onChange={s('d')} /></div>
              </div>
            )} />
        </section>

        <section id="eventos" className="card">
          <h2>Eventos y reserva</h2>
          <Field label="Título de eventos" {...bind(['eventos', 'titulo'])} />
          <Field label="Texto de eventos" multiline max={420} {...bind(['eventos', 'texto'])} />
          <div className="two">
            <Field label="Botón" {...bind(['eventos', 'boton'])} />
            <Field label="Mensaje de WhatsApp" {...bind(['eventos', 'mensaje'])} />
          </div>
          <hr />
          <Field label="Título de reserva" {...bind(['reserva', 'titulo'])} />
          <Field label="Texto de reserva" multiline max={420} {...bind(['reserva', 'texto'])} />
          <Field label="Opciones de turno" hint="Separadas por coma. Ej.: Mañana, Tarde, Noche"
            value={c.reserva.turnos.join(', ')} onChange={(v) => set(['reserva', 'turnos'])(v.split(',').map((t) => t.trimStart()))} />
        </section>

        <section id="contacto" className="card">
          <h2>Contacto</h2>
          <div className="two">
            <Field label="WhatsApp (solo números, con 549)" {...bind(['contacto', 'whatsapp'])} hint="Ej.: 5491136949963" />
            <Field label="Teléfono como se muestra" {...bind(['contacto', 'telefono'])} />
            <Field label="Instagram" prefix="@" {...bind(['contacto', 'instagram'])} />
            <Field label="Lugar" {...bind(['contacto', 'lugar'])} />
            <Field label="Ciudad" {...bind(['contacto', 'ciudad'])} />
            <Field label="Link de Google Maps" {...bind(['contacto', 'maps'])} />
          </div>
          <Field label="Texto del pie de página" multiline max={420} {...bind(['footer'])} />
        </section>

        <section id="google" className="card">
          <h2>Google y redes</h2>
          <p className="hint">Lo que aparece en los resultados de Google y al compartir el link por WhatsApp.</p>
          <Field label="Título" max={70} {...bind(['seo', 'title'])} />
          <Field label="Descripción" multiline max={160} {...bind(['seo', 'description'])} />
          <div className="serp" aria-label="Vista previa en Google">
            <span>lachicadelasunias.com</span>
            <b>{c.seo.title}</b>
            <p>{c.seo.description}</p>
          </div>
        </section>
      </main>

      <footer className={`bar ${dirty ? 'dirty' : pub.state}`}>
        <div className="bar-in">
          <p role="status">{status}</p>
          <div className="bar-a">
            {dirty && !busy && <button type="button" className="btn btn-ghost" onClick={() => confirm('¿Descartar los cambios sin publicar?') && setC(saved.content)}>Descartar</button>}
            <button type="button" className="btn" disabled={!dirty || busy} onClick={() => publish()}>{busy ? 'Publicando…' : 'Publicar'}</button>
          </div>
        </div>
      </footer>
    </div>
  )
}
