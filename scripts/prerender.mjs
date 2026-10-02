// Después de `vite build`: renderiza <App /> a HTML y lo inyecta en dist/index.html,
// así los buscadores y las redes ven los títulos y textos sin ejecutar JavaScript.
import { createServer } from 'vite'
import { readFile, writeFile } from 'node:fs/promises'
import { SITE } from './site.mjs'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { render } = await vite.ssrLoadModule('/src/entry-server.jsx')
  const html = render()
  const file = new URL('../dist/index.html', import.meta.url)
  const page = await readFile(file, 'utf-8')
  const marca = '<div id="root"></div>'
  if (!page.includes(marca)) throw new Error('No encontré ' + marca + ' en dist/index.html')
  await writeFile(file, page.replace(marca, `<div id="root">${html}</div>`))
  const hoy = new Date().toISOString().slice(0, 10)
  const dist = (f) => new URL(`../dist/${f}`, import.meta.url)
  await writeFile(dist('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE}/</loc><lastmod>${hoy}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url></urlset>\n`)
  // el panel consulta este archivo para saber cuándo ya está online lo que publicó
  const { id } = JSON.parse(await readFile(new URL('../src/content/current.json', import.meta.url), 'utf-8'))
  await writeFile(dist('version.json'), JSON.stringify({ id, builtAt: new Date().toISOString() }))
  await writeFile(dist('robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`)
  console.log(`Sitio: ${SITE}`)
  console.log(`Prerender OK (${(html.length / 1024).toFixed(1)} KB de HTML)`)
} finally {
  await vite.close()
}
