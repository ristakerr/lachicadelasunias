// URL pública del sitio. Se usa en OpenGraph, canonical, sitemap y robots.
// Prioridad: SITE_URL (definila en Vercel cuando el dominio propio esté activo)
//            > dominio de producción de Vercel > URL del deploy > fallback.
const env = process.env
const host = env.VERCEL_ENV === 'production' ? env.VERCEL_PROJECT_PRODUCTION_URL : env.VERCEL_URL
export const SITE = (env.SITE_URL || (host ? `https://${host}` : 'https://lachicadelasunias.vercel.app')).replace(/\/+$/, '')
