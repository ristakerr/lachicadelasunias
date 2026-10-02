// Ayudas de formato que usa el sitio (sin el contenido por defecto, para no sumarlo al bundle público)
export const money = (n) => '$' + Number(n).toLocaleString('es-AR')
export const igUrl = (c) => `https://instagram.com/${c.contacto.instagram}`
// "Uñas que se notan *antes* de que hables" → partes para resaltar la palabra entre asteriscos
export const emphasis = (s) => s.split(/\*([^*]+)\*/).map((t, i) => ({ t, em: i % 2 === 1 }))
