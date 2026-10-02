import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync, createReadStream } from 'node:fs'
import { join, normalize as normPath } from 'node:path'
import { SITE } from './scripts/site.mjs'
import { igUrl } from './src/content/format.js'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const current = () => JSON.parse(readFileSync(new URL('./src/content/current.json', import.meta.url), 'utf-8')).content

function jsonLd(C) {
  const ld = {
    '@context': 'https://schema.org', '@type': 'BeautySalon', '@id': `${SITE}/#negocio`, name: 'La chica de las uñas',
    description: C.seo.description, url: `${SITE}/`, image: `${SITE}/og-image.jpg?v=3`, telephone: `+${C.contacto.whatsapp}`, priceRange: '$$',
    areaServed: C.contacto.ciudad,
    address: { '@type': 'PostalAddress', streetAddress: C.contacto.lugar, addressLocality: 'Buenos Aires', addressCountry: 'AR' },
    geo: { '@type': 'GeoCoordinates', latitude: -34.6342568, longitude: -58.5002893 },
    hasMap: C.contacto.maps, sameAs: [igUrl(C)],
    contactPoint: { '@type': 'ContactPoint', telephone: `+${C.contacto.whatsapp}`, contactType: 'reservas', availableLanguage: 'es' },
    hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Promos', itemListElement: C.promos.map((p) => ({ '@type': 'Offer', priceCurrency: 'ARS', price: String(p.price), itemOffered: { '@type': 'Service', name: p.name, description: p.desc } })) },
  }
  return JSON.stringify(ld).replace(/</g, '\\u003c')
}

// Completa index.html con la URL del sitio y los textos SEO del contenido publicado
const seo = {
  name: 'seo',
  transformIndexHtml: {
    order: 'pre',
    handler(html, ctx) {
      if (!ctx.filename.endsWith('index.html')) return html
      const C = current()
      return html.replaceAll('__SITE__', SITE).replaceAll('__TITLE__', esc(C.seo.title)).replaceAll('__DESC__', esc(C.seo.description)).replace('__JSONLD__', jsonLd(C))
    },
  },
}

// En desarrollo (npm run dev) atiende /api/* con las mismas funciones que usa Vercel,
// así el panel se puede probar completo en tu compu.
const devApi = {
  name: 'dev-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const url = new URL(req.url, `http://${req.headers.host}`)
      if (url.pathname.startsWith('/cms-local/')) {
        const file = normPath(join(process.cwd(), '.cms-local', url.pathname.slice(11)))
        if (!file.startsWith(join(process.cwd(), '.cms-local')) || !existsSync(file)) return next()
        return createReadStream(file).pipe(res)
      }
      const m = url.pathname.match(/^\/api\/(login|content|upload)$/)
      if (!m) return next()
      const mod = await server.ssrLoadModule(`/api/${m[1]}.js`)
      const fn = mod[req.method]
      if (!fn) { res.statusCode = 405; return res.end() }
      const chunks = []
      for await (const c of req) chunks.push(c)
      const request = new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) })
      const response = await fn(request)
      res.statusCode = response.status
      response.headers.forEach((v, k) => res.setHeader(k, v))
      res.end(Buffer.from(await response.arrayBuffer()))
    })
  },
}

export default defineConfig({
  plugins: [react(), seo, devApi],
  server: { watch: { ignored: ['**/.cms-local/**'] } },
  build: {
    rollupOptions: {
      input: { main: 'index.html', unias: 'unias.html' },
    },
  },
})
