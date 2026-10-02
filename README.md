# La chica de las uñas

Landing en Vite + React con panel de edición en **`/unias.html`**.

    npm install
    npm run dev      # desarrollo: sitio en http://localhost:5173 y panel en /unias.html
    npm run build    # genera /dist para publicar

## Cómo funciona el panel

1. Entrás a `lachicadelasunias.com/unias.html` con la contraseña.
2. Editás promos y precios, portada, galería (subiendo fotos), opiniones, números, eventos, contacto y textos de Google.
3. Tocás **Publicar**. El contenido se guarda en Vercel Blob y se dispara un Deploy Hook.
   Vercel regenera el sitio en ~1 minuto, con el HTML prerenderizado (SEO y vista previa de WhatsApp al día).
   El panel avisa cuando los cambios ya están online.

Las fotos se achican en el navegador (máx. 1600 px) antes de subirse. Se guardan las últimas 30 versiones del contenido en Blob (`cms/content-*.json`) por si hace falta volver atrás.

## Configuración en Vercel (una sola vez)

1. **Blob**: en el proyecto, *Storage → Create Database → Blob*. Elegí acceso **Public** y conectalo al proyecto.
   Vercel crea solo la variable `BLOB_READ_WRITE_TOKEN`.
2. **Variables** (*Settings → Environment Variables*, entorno Production):
   - `ADMIN_PASSWORD`: la contraseña del panel. Usá una larga (12+ caracteres).
   - `SITE_URL`: `https://lachicadelasunias.com`
   - `SESSION_SECRET` (opcional): cualquier texto largo al azar; cambiarlo cierra todas las sesiones.
3. **Deploy Hook**: *Settings → Git → Deploy Hooks*. Nombre `panel`, rama `main`. Copiá la URL y guardala como variable `DEPLOY_HOOK_URL`.
   (Los Deploy Hooks requieren que el proyecto esté conectado a un repo de GitHub/GitLab/Bitbucket.)
4. Hacé un *Redeploy* para que tome las variables. Listo: entrá a `/unias.html`.

## Archivos

| Archivo | Qué hace |
|---|---|
| `src/content/default.js` | Contenido inicial (se usa hasta la primera publicación) |
| `src/content/schema.js` | Valida y limpia lo que llega del panel |
| `scripts/pull-content.mjs` | Antes del build, baja la última versión publicada a `src/content/current.json` |
| `api/login.js`, `api/content.js`, `api/upload.js` | Funciones serverless del panel |
| `server/` | Login con cookie firmada, almacenamiento (Blob o carpeta local) y deploy hook |
| `src/admin/` | El panel |

## Probar el panel en tu compu

`npm run dev` y abrí `http://localhost:5173/unias.html`. Sin variables configuradas, la contraseña es `unias-local`
y todo se guarda en la carpeta `.cms-local/` (no se sube a Git). Al publicar, la página de prueba se actualiza sola.

## Seguridad

- La URL del panel no es secreta; lo que protege es la contraseña. El panel lleva `noindex` y no está en el sitemap.
- La sesión es una cookie `HttpOnly` y `SameSite=Strict` firmada con HMAC, válida 14 días.
- Los pedidos que modifican datos tienen que venir del mismo dominio.
- Todo lo que se guarda pasa por `schema.js`: solo se aceptan fotos propias o de Vercel Blob, links de Google Maps, y textos con largo máximo.
