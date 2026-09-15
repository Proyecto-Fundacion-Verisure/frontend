/**
 * Actividad por la que se entra al tablero de inscripciones.
 *
 * Es «Visitas a residencias» en la semilla del backend: aforo 2, dos plazas
 * confirmadas y cola, así que es la única que llena varias secciones del tablero
 * con acciones. Las demás están vacías o tienen una sola fila.
 *
 * Existe porque `GET /api/activities` todavía es de BE2 y no hay forma de
 * navegar hasta un tablero desde una lista real. El número estaba escrito a mano
 * en dos ficheros, y al cambiar uno el otro se quedó apuntando a una actividad
 * sin inscripciones, con los tres contadores a cero. Desaparece cuando `B2-07`
 * entregue el catálogo.
 */
export const DEMO_ACTIVITY_ID = 10;

export const DEMO_REGISTRATIONS_PATH = `/activities/${DEMO_ACTIVITY_ID}/registrations`;
