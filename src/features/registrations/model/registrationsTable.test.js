import { describe, expect, it } from 'vitest';
import {
  REGISTRATION_SECTIONS,
  getBoardTotals,
  getCountsSummary,
  getEmptySectionTitle,
  getRegistrations,
  getSection,
  getSectionCaption,
  getSectionKey,
  getSectionRows,
  getSectionStatusBadge,
  getSectionTabs,
  groupRegistrationsBySection,
  hasRowActions,
} from './registrationsTable';

const UNREVIEWED = { registrationId: 1, status: 'WAITLISTED', accepted: false };
const ACCEPTED_IN_QUEUE = { registrationId: 2, status: 'WAITLISTED', accepted: true };
const CONFIRMED = { registrationId: 3, status: 'CONFIRMED' };
const PENDING_CLOSURE = { registrationId: 4, status: 'PENDING_CLOSURE' };
const CLOSED = { registrationId: 5, status: 'CLOSED' };
const REJECTED = { registrationId: 6, status: 'REJECTED' };

const REGISTRATIONS = [UNREVIEWED, ACCEPTED_IN_QUEUE, CONFIRMED, PENDING_CLOSURE, CLOSED, REJECTED];

describe('registrationsTable model', () => {
  it('clasifica cada fila en su sección', () => {
    expect(getSectionKey(UNREVIEWED)).toBe('unreviewed');
    expect(getSectionKey(ACCEPTED_IN_QUEUE)).toBe('accepted-waitlist');
    expect(getSectionKey(CONFIRMED)).toBe('confirmed');
    expect(getSectionKey(PENDING_CLOSURE)).toBe('pending-report');
    expect(getSectionKey(CLOSED)).toBe('closed');
    expect(getSectionKey(REJECTED)).toBe('rejected');
    expect(getSectionKey({ status: 'DESCONOCIDO' })).toBe('unreviewed');
  });

  it('agrupa conservando el orden de llegada', () => {
    const grouped = groupRegistrationsBySection(REGISTRATIONS);

    expect(grouped.unreviewed).toEqual([UNREVIEWED]);
    expect(grouped['accepted-waitlist']).toEqual([ACCEPTED_IN_QUEUE]);
    expect(grouped.confirmed).toEqual([CONFIRMED]);
  });

  it('junta sin revisar y aceptadas en la pestaña de lista de espera', () => {
    const grouped = groupRegistrationsBySection(REGISTRATIONS);

    expect(getSectionRows(grouped, 'waitlisted')).toEqual([UNREVIEWED, ACCEPTED_IN_QUEUE]);
    expect(getSectionRows(grouped, 'closed')).toEqual([CLOSED]);
    expect(getSectionRows(grouped, 'cancelled')).toEqual([]);
  });

  it('decide qué filas admiten acciones', () => {
    expect(hasRowActions(UNREVIEWED)).toBe(true);
    expect(hasRowActions(CONFIRMED)).toBe(true);
    expect(hasRowActions(PENDING_CLOSURE)).toBe(true);
    expect(hasRowActions(CLOSED)).toBe(false);
    expect(hasRowActions(REJECTED)).toBe(false);
  });

  it('resuelve el badge de estado y cae a «sin revisar»', () => {
    expect(getSectionStatusBadge(ACCEPTED_IN_QUEUE)).toMatchObject({ variant: 'info' });
    expect(getSectionStatusBadge(CLOSED)).toMatchObject({ label: 'Cerrada', variant: 'neutral' });
    expect(getSectionStatusBadge({ status: 'DESCONOCIDO' })).toMatchObject({ label: 'Sin revisar' });
  });

  it('lee las filas del Page de Spring y descarta respuestas raras', () => {
    expect(getRegistrations({ content: REGISTRATIONS })).toEqual(REGISTRATIONS);
    expect(getRegistrations({ content: 'no-es-lista' })).toEqual([]);
    expect(getRegistrations(null)).toEqual([]);
  });

  it('usa los totales del backend y cae a las filas presentes', () => {
    expect(getBoardTotals({ totalElements: 40, totalPages: 4 }, REGISTRATIONS)).toEqual({
      totalElements: 40,
      totalPages: 4,
    });
    expect(getBoardTotals(null, REGISTRATIONS)).toEqual({ totalElements: 6, totalPages: 1 });
    expect(getBoardTotals({ totalPages: 0 }, [])).toEqual({ totalElements: 0, totalPages: 1 });
  });

  it('genera las pestañas con el recuento de cada sección', () => {
    const grouped = groupRegistrationsBySection(REGISTRATIONS);
    const tabs = getSectionTabs(grouped);

    expect(tabs).toHaveLength(REGISTRATION_SECTIONS.length);
    expect(tabs[0]).toEqual({ id: 'waitlisted', label: 'En lista de espera', count: 2 });
    expect(tabs[2]).toEqual({ id: 'pending-report', label: 'Pendientes de cierre', count: 1 });
  });

  it('compone los textos de sección y del resumen', () => {
    expect(getSection('confirmed').title).toBe('Confirmadas');
    expect(getSection('inexistente')).toEqual(REGISTRATION_SECTIONS[0]);
    expect(getSectionCaption({ isGlobal: true, sectionTitle: 'Cerradas' })).toBe('Cerradas');
    expect(getSectionCaption({ isGlobal: false, sectionTitle: 'Cerradas' }))
      .toBe('Cerradas de la actividad');
    expect(getEmptySectionTitle({ title: 'Canceladas' })).toBe('No hay inscripciones canceladas');
  });

  it('resume los contadores de la actividad', () => {
    expect(getCountsSummary({ confirmed: 9, waitlisted: 7, unreviewed: 4 }))
      .toBe('Confirmadas 9 · En lista de espera 7, de las que 4 sin revisar');
    expect(getCountsSummary({ confirmed: 9, waitlisted: 7, unreviewed: 0 }))
      .toBe('Confirmadas 9 · En lista de espera 7');
    expect(getCountsSummary(null)).toBeNull();
  });
});
