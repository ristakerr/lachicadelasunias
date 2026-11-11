import { useState, useEffect, Fragment } from 'react'

import data from './content/current.json'
import { money, igUrl, emphasis } from './content/format.js'

const C = data.content
const WA = C.contacto.whatsapp
const IG = igUrl(C)
const TEL = C.contacto.telefono
const MAPS = C.contacto.maps
const PROMOS = C.promos.map((p) => ({ ...p, price: money(p.price) }))
const ESENCIA = C.esencia
const AUTORIDAD = C.autoridad
const OPINIONES = C.opiniones
const GALERIA = C.galeria

const STAR = 'M12 2.5l2.9 6.4 7 .7-5.3 4.7 1.6 6.9L12 17.6l-6.2 3.6 1.6-6.9L2.1 9.6l7-.7z'
const Stars = () => <span className="stars" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <svg key={i} viewBox="0 0 24 24"><path d={STAR} /></svg>)}</span>
const DESDE = money(Math.min(...C.promos.map((p) => p.price)))

const NAV = [['#promos', 'Promos'], ['#galeria', 'Galería'], ['#opiniones', 'Opiniones'], ['#eventos', 'Eventos']]
function Row({ rev }) {
  const list = rev ? [...GALERIA].reverse() : GALERIA
  return (
    <div className={`track${rev ? ' rev' : ''}`} data-x="0.18">
      {[0, 1].map((copy) =>
        list.map((src, i) => (
          <img key={`${copy}-${i}`} className="ph" src={src} width="264" height="352" decoding="async" loading="lazy"
            alt={copy ? '' : `Diseño de uñas ${i + 1}: semipermanente y decoración`} aria-hidden={copy ? 'true' : undefined} />
        ))
      )}
    </div>
  )
}

export default function App() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { document.querySelectorAll('.reveal, .hd').forEach((e) => e.classList.add('in')); return }
    // Texto palabra por palabra: cada palabra aparece en cascada al llegar a pantalla
    const splitWords = (root) => {
      let n = 0
      const walk = (node) => [...node.childNodes].forEach((ch) => {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment()
          ch.textContent.split(/(\s+)/).forEach((t) => {
            if (!t) return
            if (/^\s+$/.test(t)) return frag.append(t)
            const w = document.createElement('span')
            w.className = 'w'
            w.style.setProperty('--i', Math.min(n++, 22))
            w.textContent = t
            frag.append(w)
          })
          ch.replaceWith(frag)
        } else if (ch.nodeType === 1) walk(ch)
      })
      walk(root)
      root.dataset.split = '1'
    }
    document.querySelectorAll('.hero .lead').forEach((el) => { if (!el.dataset.split) splitWords(el) });

    // Inicio: el texto del hero aparece solo, sin esperar al scroll
    [['.hero .row', 700, 0], ['.hero-photos .hp', 200, 120]].forEach(([sel, base, step]) =>
      document.querySelectorAll(sel).forEach((el, i) => { el.style.transitionDelay = `${base + i * step}ms` }))
    const heroT = setTimeout(() => document.querySelectorAll('.hero h1, .hero .lead, .hero .reveal').forEach((el) => el.classList.add('in')), 120)
    const groups = [
      ['.sec > :not(.menu):not(.bento):not(.revs), .band > :not(.btn)', 0, null],
      ['.book', 0, () => 'r-zoom'],
      ['.card', 70, null],
      ['.rev', 70, null],
      ['.item', 70, null],
      ['.book > div:first-child', 0, () => 'r-left'],
      ['.book form', 0, () => 'r-right'],
      ['.book form > label, .book form > .two', 70, null],
    ]
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return
      e.target.classList.add('in'); io.unobserve(e.target)
      setTimeout(() => { e.target.style.transitionDelay = '' }, 1500)
    }), { threshold: 0.12 })
    // párrafos partidos y títulos (.hd) se revelan al llegar a pantalla, estén o no en un grupo
    document.querySelectorAll('[data-split], .hd').forEach((el) => io.observe(el))
    groups.forEach(([sel, step, variant]) => document.querySelectorAll(sel).forEach((el, i) => {
      if (!el.dataset.split) {
        el.classList.add('reveal')
        if (variant) el.classList.add(variant(i))
        if (step) el.style.transitionDelay = `${(i % 3) * step}ms`
      }
      io.observe(el)
    }))
    // pausa animaciones infinitas fuera de pantalla (rendimiento)
    const vis = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle('off', !e.isIntersecting)))
    document.querySelectorAll('.marquee').forEach((el) => vis.observe(el))
    return () => { clearTimeout(heroT); io.disconnect(); vis.disconnect() }
  }, [])

  // Movimiento ligado al scroll (parallax). Respeta "reducir movimiento" del sistema
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const els = [...document.querySelectorAll('[data-speed],[data-hero],[data-x]')]
    let raf = 0
    const update = () => {
      raf = 0
      const vh = window.innerHeight, y = window.scrollY
      const flat = window.innerWidth <= 820 // en celular el parallax desordena las tarjetas apiladas
      document.documentElement.style.setProperty('--p', (y / Math.max(1, document.documentElement.scrollHeight - vh)).toFixed(3))
      els.forEach((el) => {
        if (el.dataset.hero) {
          const py = y < vh * 1.3 ? y * parseFloat(el.dataset.hero) : 0
          el.style.setProperty('--py', `${py.toFixed(1)}px`)
          if (el.dataset.fade) el.style.opacity = Math.max(0, 1 - y / (vh * 0.8)).toFixed(2)
          return
        }
        if (flat && !el.dataset.x) { el.style.setProperty('--py', '0px'); return }
        const r = el.getBoundingClientRect()
        if (r.bottom < -300 || r.top > vh + 300) return
        const mid = r.top + r.height / 2 - vh / 2
        if (el.dataset.x) { el.style.setProperty('--px', `${(mid * parseFloat(el.dataset.x)).toFixed(1)}px`); return }
        const py = -(mid - (el._py || 0)) * parseFloat(el.dataset.speed)
        el._py = py
        el.style.setProperty('--py', `${py.toFixed(1)}px`)
      })
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf) }
  }, [])

  const [f, setF] = useState({ nombre: '', servicio: '', fecha: '', turno: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  // menú hamburguesa: se cierra con Escape, al pasar a escritorio y al elegir un enlace
  const [menu, setMenu] = useState(false)
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMenu(false) }
    const onResize = () => { if (window.innerWidth > 640) setMenu(false) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('resize', onResize) }
  }, [])
  const close = () => setMenu(false)

  const enviar = (e) => {
    e.preventDefault()
    const msg = `Hola! Soy ${f.nombre}. Quiero reservar un turno.\nServicio: ${f.servicio}\nFecha: ${f.fecha || 'a coordinar'}\nTurno: ${f.turno || 'a coordinar'}`
    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <>
      <header className={`nav${menu ? ' open' : ''}`}>
        <a href="#top" className="logo" onClick={close}>La chica de las uñas</a>
        <button type="button" className="burger" aria-label={menu ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menu} aria-controls="menu" onClick={() => setMenu(!menu)}>
          <span /><span /><span />
        </button>
        <nav id="menu" aria-label="Principal">
          {NAV.map(([href, t]) => <a key={href} href={href} onClick={close}>{t}</a>)}
          <a href="#reserva" className="btn btn-sm" onClick={close}>Reservar</a>
        </nav>
      </header>

      <main>
      <section className="hero" id="top">
        <div className="hero-in" data-hero="0.3" data-fade="1">
          <p className="kicker reveal">{C.hero.kicker}</p>
          <h1 className="hd">{emphasis(C.hero.titulo).map((x, i) => (x.em ? <em key={i}>{x.t}</em> : <Fragment key={i}>{x.t}</Fragment>))}</h1>
          <p className="lead">{C.hero.texto}</p>
          <div className="row reveal">
            <a className="btn" href="#reserva">Reservar turno</a>
            <a className="btn btn-ghost" href="#promos">Ver promos desde {DESDE}</a>
          </div>
        </div>
        <div className="hero-photos" aria-hidden="true" data-hero="0.12">
          {C.hero.fotos.map((src, i) => <img key={i} className={`hp hp${i + 1} reveal r-zoom`} src={src} alt="" />)}
        </div>
      </section>

      <section className="proof" aria-label="Experiencia y reconocimiento">
        <ul>
          {AUTORIDAD.map((x, i) => (
            <li key={i}><strong>{x.n}</strong> <span>{x.t}</span>{x.stars && <Stars />}</li>
          ))}
        </ul>
      </section>

      <section className="sec">
        <h2 className="hd">Lo que nos define</h2>
        <div className={`bento n${Math.min(ESENCIA.length, 5)}`}>
          {ESENCIA.map((x, i) => (
            <article key={i} className="card" style={{ '--img': `url("${x.img}")` }}>
              <h3>{x.t}</h3>
              <p>{x.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sec sec-soft" id="promos">
        <h2 className="hd">Promos de uñas</h2>
        <p className="sub">{C.promosIntro}</p>
        <ul className="menu">
          {PROMOS.map((p, i) => (
            <li key={i} className={`item${p.star ? ' star' : ''}`}>
              <div className="item-t">
                <h3>{p.name}{p.star && <span className="tag">La más pedida</span>}</h3>
                <p>{p.desc}</p>
              </div>
              <strong>{p.price}</strong>
              <a className={`btn btn-sm${p.star ? '' : ' btn-ghost'}`} href="#reserva" aria-label={`Elegir ${p.name}`} onClick={() => setF({ ...f, servicio: `${p.name} (${p.price})` })}>Elegir</a>
            </li>
          ))}
        </ul>
      </section>

      <section className="sec sec-wide" id="galeria">
        <h2 className="hd">Nuestros trabajos</h2>
        <div className="marquee" aria-label="Galería de trabajos"><Row /></div>
        <p className="sub"><a href={IG} target="_blank" rel="noreferrer">Mirá más en @{C.contacto.instagram}</a></p>
      </section>

      <section className="sec" id="opiniones">
        <h2 className="hd">Lo que dicen las clientas</h2>
        <div className="rating-wrap">
          <a className="rating" href={MAPS} target="_blank" rel="noreferrer" aria-label={`${C.rating.score} de 5 en Google, ${C.rating.count} opiniones. Ver en Google Maps`}>
            <b>{C.rating.score}</b><Stars /><span>{C.rating.count} opiniones en Google</span>
          </a>
        </div>
        <div className="revs">
          {OPINIONES.map((o, i) => (
            <figure key={i} className={`rev${i === 0 ? ' lead-q' : ''}`}>
              <blockquote><p>{o.q}</p></blockquote>
              <figcaption><b>{o.n}</b><span>{o.m}</span></figcaption>
            </figure>
          ))}
        </div>
        <p className="sub more"><a href={MAPS} target="_blank" rel="noreferrer">Leer las {C.rating.count} opiniones en Google Maps</a></p>
      </section>

      <section className="band" id="eventos">
        <h2 className="hd">{C.eventos.titulo}</h2>
        <p>{C.eventos.texto}</p>
        <a className="btn" href={`https://wa.me/${WA}?text=${encodeURIComponent(C.eventos.mensaje)}`}>{C.eventos.boton}</a>
      </section>

      <section className="sec" id="reserva">
        <div className="book">
          <div>
            <h2 className="left hd">{C.reserva.titulo}</h2>
            <p>{C.reserva.texto}</p>
            <dl>
              <dt>Dónde</dt><dd>{C.contacto.lugar}</dd>
              <dt>WhatsApp</dt><dd><a href={`https://wa.me/${WA}`}>{TEL}</a></dd>
              <dt>Instagram</dt><dd><a href={IG} target="_blank" rel="noreferrer">@{C.contacto.instagram}</a></dd>
            </dl>
          </div>
          <form onSubmit={enviar}>
            <label>Nombre<input value={f.nombre} onChange={set('nombre')} autoComplete="given-name" required /></label>
            <label>Servicio
              <select value={f.servicio} onChange={set('servicio')} required>
                <option value="">Elegí una opción</option>
                {PROMOS.map((p, i) => <option key={i} value={`${p.name} (${p.price})`}>{p.name} · {p.price}</option>)}
                <option value="Otro / quiero consultar">Otro / quiero consultar</option>
              </select>
            </label>
            <div className="two">
              <label>Fecha<input type="date" value={f.fecha} onChange={set('fecha')} /></label>
              <label>Turno
                <select value={f.turno} onChange={set('turno')}>
                  <option value="">A coordinar</option>
                  {C.reserva.turnos.map((t, i) => <option key={i}>{t}</option>)}
                </select>
              </label>
            </div>
            <button className="btn">Reservar por WhatsApp</button>
          </form>
        </div>
      </section>

      </main>
      <footer className="foot">
        <div className="foot-in">
          <div className="foot-brand">
            <p className="foot-logo">La chica de las uñas</p>
            <p>{C.footer}</p>
          </div>
          <nav aria-label="Secciones del sitio">
            <h2 className="foot-h">Secciones</h2>
            <ul>
              {NAV.map(([href, t]) => <li key={href}><a href={href}>{t}</a></li>)}
              <li><a href="#reserva">Reservar turno</a></li>
            </ul>
          </nav>
          <nav aria-label="Servicios">
            <h2 className="foot-h">Servicios</h2>
            <ul>
              {PROMOS.map((p, i) => <li key={i}><a href="#promos">{p.name}</a></li>)}
              <li><a href="#eventos">Uñas para eventos privados</a></li>
            </ul>
          </nav>
          <address>
            <h2 className="foot-h">Contacto</h2>
            <p>{C.contacto.lugar}<br />{C.contacto.ciudad}</p>
            <ul>
              <li><a href={`https://wa.me/${WA}`} rel="noopener">WhatsApp {TEL}</a></li>
              <li><a href={IG} target="_blank" rel="noopener noreferrer me">Instagram @{C.contacto.instagram}</a></li>
              <li><a href={MAPS} target="_blank" rel="noopener noreferrer">Cómo llegar en Google Maps</a></li>
            </ul>
          </address>
        </div>
        <p className="foot-copy">© {new Date().getFullYear()} La chica de las uñas · Uñas semipermanentes y capping gel en Buenos Aires</p>
      </footer>
    </>
  )
}
