import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDate, formatDateRange, formatDateTime, isPastLocalDate, parseLocalDate } from './dates';

afterEach(() => {
  vi.useRealTimers();
});

/** Fija el reloj a un instante local, no UTC: es justo lo que se está probando. */
const freezeLocal = (year, month, day, hour = 12) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(year, month - 1, day, hour));
};

describe('parseLocalDate', () => {
  it('lee YYYY-MM-DD como día del calendario local, no como medianoche UTC', () => {
    const date = parseLocalDate('2026-09-15');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(15);
  });

  it('se queda con el día de un ISO con hora', () => {
    expect(parseLocalDate('2026-10-08T21:59:00Z').getDate()).toBe(8);
  });

  it('devuelve null en vez de un Invalid Date cuando no hay fecha', () => {
    expect(parseLocalDate(undefined)).toBeNull();
    expect(parseLocalDate('')).toBeNull();
    expect(parseLocalDate('mañana')).toBeNull();
  });
});

describe('isPastLocalDate', () => {
  it('el propio día del plazo todavía no ha pasado', () => {
    freezeLocal(2026, 9, 15);
    expect(isPastLocalDate('2026-09-15')).toBe(false);
  });

  it('sigue sin haber pasado a última hora de ese mismo día', () => {
    freezeLocal(2026, 9, 15, 23);
    expect(isPastLocalDate('2026-09-15')).toBe(false);
  });

  // La regresión que se corrige: con `new Date('2026-09-15') < new Date()` esto
  // daba `true` ya el día 14 por la tarde, en cualquier zona al este de UTC.
  it('la víspera tampoco ha pasado', () => {
    freezeLocal(2026, 9, 14, 23);
    expect(isPastLocalDate('2026-09-15')).toBe(false);
  });

  it('el día siguiente sí ha pasado', () => {
    freezeLocal(2026, 9, 16, 0);
    expect(isPastLocalDate('2026-09-15')).toBe(true);
  });

  it('sin fecha no hay plazo que cerrar', () => {
    expect(isPastLocalDate(undefined)).toBe(false);
  });
});

describe('formatDate', () => {
  it('pinta el día que dice la cadena, sin desplazarlo por la zona horaria', () => {
    expect(formatDate('2026-09-15')).toBe('15 sept 2026');
  });

  it('admite otro formato, como el mes entero del certificado', () => {
    expect(formatDate('2026-09-15', { day: 'numeric', month: 'long', year: 'numeric' }))
      .toBe('15 de septiembre de 2026');
  });

  it('devuelve un guion cuando no hay fecha', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('vete a saber')).toBe('—');
  });
});

describe('formatDateTime', () => {
  // Un instante sí lleva zona, y se quiere ver en la hora de quien mira; por eso
  // no pasa por `parseLocalDate`.
  it('convierte un instante a la hora local', () => {
    expect(formatDateTime('2026-09-15T10:00:00Z')).toBe('15 sept 2026');
  });

  it('devuelve un guion cuando no hay instante', () => {
    expect(formatDateTime(undefined)).toBe('—');
    expect(formatDateTime('no es una fecha')).toBe('—');
  });
});

describe('formatDateRange', () => {
  it('pinta los dos extremos cuando son días distintos', () => {
    expect(formatDateRange('2026-03-02', '2026-03-27')).toBe('2 mar 2026 — 27 mar 2026');
  });

  // Cuatro de las nueve actividades sembradas empiezan y acaban el mismo día:
  // repetir la fecha se lee como un error.
  it('pinta una sola fecha cuando empieza y acaba el mismo día', () => {
    expect(formatDateRange('2026-03-02', '2026-03-02')).toBe('2 mar 2026');
  });

  it('se apaña con un solo extremo', () => {
    expect(formatDateRange('2026-03-02', null)).toBe('2 mar 2026');
    expect(formatDateRange(null, '2026-03-27')).toBe('27 mar 2026');
    expect(formatDateRange(null, null)).toBe('—');
  });
});
