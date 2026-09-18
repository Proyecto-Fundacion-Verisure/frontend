// Texto de plazas compartido por la tarjeta y la ficha. «3 de 5 plazas» a secas
// no decía si quedaban libres: bajo el rótulo «Plazas ocupadas» se leía como si
// la actividad estuviera llena. Aquí se dice cuántas quedan, o que no queda ninguna.
export function formatSpots(occupied, total) {
  const free = Math.max(total - occupied, 0);
  const freeLabel = free === 0
    ? 'sin plazas libres'
    : free === 1 ? '1 plaza libre' : `${free} plazas libres`;
  return `${occupied} de ${total} plazas ocupadas · ${freeLabel}`;
}

// Estados en los que ya no cabe inscribirse aunque sobren plazas. El catálogo
// también enseña las actividades en curso y las terminadas, y sin distintivo
// una terminada con hueco parecía abierta pero sin botón.
export const LIFECYCLE_BADGES = {
  IN_PROGRESS: 'En curso',
  FINISHED: 'Finalizada',
};

// Solo `PUBLISHED` está de verdad abierta a inscripciones. `FULL` ya lleva su
// «Completa» (admite lista de espera, pero no es lo mismo que plaza libre).
export const isOpenForRegistration = (status) => status === 'PUBLISHED';
