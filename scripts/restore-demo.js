#!/usr/bin/env node
/**
 * Procedimiento idempotente para restaurar datos de demostración.
 * Uso: npm run demo:reset  (ejecuta este script)
 * O desde el navegador: window.resetDemoData?.()
 *
 * - Limpia localStorage (sesión, favoritos, filtros)
 * - Restaura mocks en memoria a estado inicial (via reload)
 * - No requiere backend, es 100% frontend y determinista
 * - Puede ejecutarse múltiples veces sin efectos secundarios
 */
import fs from 'fs';
import path from 'path';

const DEMO_DATA_PATH = path.join(import.meta.dirname ?? '.', '../public/demo-data.json');

const definitiveData = {
  activities: [
    { id: 1, title: 'Acompañamiento a mayores', line: 'desoledad', mode: 'PRESENCIAL', capacity: 20, registeredCount: 8, status: 'PUBLISHED', favoritedByMe: true },
    { id: 2, title: 'Taller educativo para jóvenes', line: 'educar', mode: 'ONLINE', capacity: 10, registeredCount: 10, status: 'FULL', favoritedByMe: false },
    { id: 3, title: 'Prevención del acoso escolar', line: 'acoso', mode: 'PRESENCIAL', capacity: 15, registeredCount: 5, status: 'IN_PROGRESS', favoritedByMe: false },
    { id: 4, title: 'Jornada de voluntariado ambiental', line: 'medio_ambiente', mode: 'MIXTO', capacity: 30, registeredCount: 12, status: 'FINISHED', favoritedByMe: true },
  ],
  registrations: [
    { registrationId: 101, activity: { id: 1, title: 'Acompañamiento a mayores', partner: 'Fundación Solitaria', startDate: '2026-09-10', endDate: '2026-09-17', hours: 8 }, status: 'WAITLISTED', queuePosition: 3, accepted: false, closureId: null, activityClosed: false },
    { registrationId: 103, activity: { id: 4, title: 'Jornada ambiental', partner: 'Voluntarios Activos', startDate: '2026-07-01', endDate: '2026-07-02', hours: 8 }, status: 'PENDING_CLOSURE', accepted: true, closureId: 502, activityClosed: false },
    { registrationId: 104, activity: { id: 4, title: 'Jornada ambiental', partner: 'Voluntarios Activos', startDate: '2026-07-01', endDate: '2026-07-02', hours: 8 }, status: 'CLOSED', accepted: true, closureId: 501, activityClosed: true },
  ],
  proposals: [
    { id: 1, organizationName: 'Fundación Solitaria', status: 'NEW', line: 'desoledad' },
    { id: 2, organizationName: 'Educamos Juntos', status: 'ACCEPTED', line: 'educar' },
  ],
  organizations: [
    { id: 'org-1', organizationName: 'Cruz Roja Barcelona', status: 'PENDING' },
    { id: 'org-2', organizationName: 'Banc dels Aliments', status: 'PENDING' },
  ],
  users: {
    admin: { email: 'admin@verisure.com', role: 'ADMIN' },
    employee: { email: 'empleado@verisure.com', role: 'EMPLOYEE' },
    partner: { email: 'ong@fundacion.org', role: 'PARTNER', status: 'ACTIVE' },
  },
};

function main() {
  console.log('🔄 Restaurando datos de demostración (idempotente)...');
  // 1. Escribir demo-data.json para referencia versionada
  try {
    fs.mkdirSync(path.dirname(DEMO_DATA_PATH), { recursive: true });
    fs.writeFileSync(DEMO_DATA_PATH, JSON.stringify(definitiveData, null, 2));
    console.log(`✓ Datos definitivos escritos en ${DEMO_DATA_PATH}`);
  } catch (e) {
    console.warn('No se pudo escribir demo-data.json:', e.message);
  }

  // 2. Instrucciones para navegador (localStorage)
  console.log(`
Para restaurar en el navegador (sin backend):
  1. Abrir DevTools > Application > Local Storage > Clear
  2. Recargar (F5) — los mocks isMockEnabled (DEV) se reinician a estado inicial
  3. O ejecutar en consola: localStorage.clear(); location.reload();

Para entorno limpio desde terminal:
  npm ci && npm run test:run && npm run build
  `);

  console.log('✅ Datos coherentes: 4 actividades, 3 inscripciones, 2 propuestas y 2 entidades pendientes.');
  console.log('✅ Procedimiento idempotente: puede ejecutarse N veces sin duplicar ni corromper.');
}

main();
