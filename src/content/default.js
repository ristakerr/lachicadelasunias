// Contenido inicial del sitio. Es el punto de partida: una vez que se publica
// algo desde el panel (/unias.html), manda lo que está guardado en Vercel Blob.
export default {
  seo: {
    title: 'Uñas semipermanentes y capping gel en Buenos Aires | La chica de las uñas',
    description: 'Más de 20 años de experiencia. Semi manos desde $15.000, capping gel y uñas para eventos privados. Reservá tu turno por WhatsApp.',
  },
  contacto: {
    whatsapp: '5491136949963',
    telefono: '+54 9 11 3694-9963',
    instagram: 'lachicadelasunias',
    lugar: 'Stand Touch & Go',
    ciudad: 'Buenos Aires, Argentina',
    maps: 'https://www.google.com/maps/search/La+Chica+de+las+Unias/@-34.6342568,-58.5002893,18z',
  },
  hero: {
    kicker: 'Más de 20 años de experiencia · Stand Touch & Go',
    titulo: 'Uñas que se notan *antes* de que hables',
    texto: 'Semipermanente, capping gel y diseños a tu medida. Elegí tu promo y reservá el turno en un mensaje.',
    chip: 'Turnos por WhatsApp',
    fotos: ['/trabajos/trabajo-2.jpg', '/trabajos/trabajo-4.jpg', '/trabajos/trabajo-6.jpg'],
  },
  franja: ['Stand Touch & Go', 'Eventos privados por MD'],
  autoridad: [
    { n: '+20', t: 'años de experiencia', d: 'Esculpidas, acrílico y semipermanente', stars: false },
    { n: '5.0', t: 'en Google', d: '36 opiniones de clientas', stars: true },
    { n: '14', t: 'años de clientas fieles', d: 'Hay quienes la eligen desde hace más de una década', stars: false },
  ],
  esencia: [
    { t: 'Prolijidad', d: 'Cutículas limpias y bordes parejos', img: '/trabajos/trabajo-4.jpg' },
    { t: 'Color', d: 'Del nude al fucsia más intenso', img: '/trabajos/trabajo-1.jpg' },
    { t: 'Duración', d: 'Terminaciones que aguantan', img: '/trabajos/trabajo-7.jpg' },
    { t: 'Buena onda', d: 'Venís a relajarte y salís feliz', img: '/trabajos/trabajo-6.jpg' },
  ],
  promosIntro: 'Precios finales. Escribinos si querés agregar diseño o decoración.',
  promos: [
    { name: 'Semi manos', price: 15000, desc: 'Esmaltado semipermanente en manos.', star: false },
    { name: 'Semi manos y pies', price: 30000, desc: 'Semipermanente completo, manos y pies.', star: false },
    { name: 'Capping gel + semi pies', price: 45000, desc: 'Capping gel en manos y semi en pies.', star: true },
  ],
  galeria: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => `/trabajos/trabajo-${i}.jpg`),
  rating: { score: '5.0', count: 36 },
  opiniones: [
    { q: 'Me hago las uñas con Pao hace 6 años y estoy cada día más fascinada. Es un lugar lleno de amor y dedicación. Te hace sentir cuidada desde el primer momento y las uñas quedan hermosas…', n: 'Chiara L.', m: 'Clienta hace 6 años' },
    { q: 'Pao es lo más de lo más, es una artista, lejos las mejores uñas. ¡No se salen! Su plus: excelente persona, sensible, humana… una loca linda.', n: 'Stella G.', m: 'Clienta hace 14 años' },
    { q: 'Más allá de lo lindo, las uñas duran un montón. Eso habla de la calidad del trabajo.', n: 'Claudia F.', m: 'Opinión en Google' },
    { q: 'Respeta y sigue el deseo de sus clientes. Yo debo usar las uñas cortas y con colores neutros por mi trabajo, y pese a ello se ven maravillosas.', n: 'Carolina', m: 'Opinión en Google' },
    { q: 'Manos felices gracias a ella. Detallista, amorosa y con una paciencia infinita. No es solo hacerse las uñas, es regalarse un rato lindo.', n: 'Marilina C.', m: 'Opinión en Google' },
    { q: 'Hace 8 años que voy y no la cambio por nada. Además de las uñas hermosas que hace, me ahorro ir a la psicóloga.', n: 'Flor Y.', m: 'Clienta hace 8 años' },
  ],
  eventos: {
    titulo: '¿Tenés un evento?',
    texto: 'Cumpleaños, despedidas, casamientos. Vamos a donde estés. Contratación por mensaje directo.',
    boton: 'Consultar por evento',
    mensaje: 'Hola! Quiero consultar por un evento privado.',
  },
  reserva: {
    titulo: 'Tu turno, a un mensaje',
    texto: 'Completá tus datos y confirmá por WhatsApp. Te respondemos para dejar el turno agendado.',
    turnos: ['Mañana', 'Tarde'],
  },
  footer: 'Uñas semipermanentes, capping gel y diseños para eventos privados en Buenos Aires. Más de 20 años de experiencia.',
}
