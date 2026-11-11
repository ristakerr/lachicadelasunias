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
function Gallery() {
  return (
    <ul className="shelf" aria-label="Galería de trabajos">
      {GALERIA.map((src, i) => (
        <li key={i}>
          <img className="ph" src={src} width="264" height="352" decoding="async" loading="lazy"
            alt={`Diseño de uñas ${i + 1}: semipermanente y decoración`} />
        </li>
      ))}
    </ul>
  )
}

export default function App() {
  // Entrada del hero, una sola vez al cargar. Las secciones de abajo se muestran tal cual,
  // sin revelado al hacer scroll: quien baja rápido no tiene que esperar al texto.
  useEffect(() => {
    const lead = document.querySelector('.hero .lead')
    if (lead && !lead.dataset.split) {
      let n = 0
      const frag = document.createDocumentFragment()
      lead.textContent.split(/(\s+)/).forEach((t) => {
        if (!t) return
        if (/^\s+$/.test(t)) return frag.append(t)
        const w = document.createElement('span')
        w.className = 'w'
        w.style.setProperty('--i', Math.min(n++, 16))
        w.textContent = t
        frag.append(w)
      })
      lead.replaceChildren(frag)
      lead.dataset.split = '1'
    }
    document.querySelectorAll('.hero-photos .hp').forEach((el, i) => { el.style.transitionDelay = `${120 + i * 60}ms` })
    const t = setTimeout(() => document.querySelector('.hero')?.classList.add('in'), 40)
    return () => clearTimeout(t)
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
        <div className="hero-in">
          <p className="kicker">{C.hero.kicker}</p>
          <h1>{emphasis(C.hero.titulo).map((x, i) => (x.em ? <em key={i}>{x.t}</em> : <Fragment key={i}>{x.t}</Fragment>))}</h1>
          <p className="lead">{C.hero.texto}</p>
          <div className="row">
            <a className="btn" href="#reserva">Reservar turno</a>
            <a className="btn btn-ghost" href="#promos">Ver promos desde {DESDE}</a>
          </div>
        </div>
        <div className="hero-photos" aria-hidden="true">
          {C.hero.fotos.map((src, i) => <img key={i} className={`hp hp${i + 1}`} src={src} alt="" />)}
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
        <h2>Lo que nos define</h2>
        <div className="bento" style={{ '--n': ESENCIA.length <= 5 ? ESENCIA.length : Math.ceil(ESENCIA.length / 2) }}>
          {ESENCIA.map((x, i) => (
            <article key={i} className="card" style={{ '--img': `url("${x.img}")` }}>
              <h3>{x.t}</h3>
              <p>{x.d}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sec sec-soft" id="promos">
        <h2>Promos de uñas</h2>
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
        <h2>Nuestros trabajos</h2>
        <Gallery />
        <p className="sub"><a href={IG} target="_blank" rel="noreferrer">Mirá más en @{C.contacto.instagram}</a></p>
      </section>

      <section className="sec" id="opiniones">
        <h2>Lo que dicen las clientas</h2>
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
        <h2>{C.eventos.titulo}</h2>
        <p>{C.eventos.texto}</p>
        <a className="btn" href={`https://wa.me/${WA}?text=${encodeURIComponent(C.eventos.mensaje)}`}>{C.eventos.boton}</a>
      </section>

      <section className="sec" id="reserva">
        <div className="book">
          <div>
            <h2 className="left">{C.reserva.titulo}</h2>
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
