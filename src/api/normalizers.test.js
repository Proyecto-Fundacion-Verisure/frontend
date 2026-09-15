import { describe, expect, it } from 'vitest';
import {
  normalizeActivity,
  normalizeCertificate,
  normalizeRegistration,
  normalizeResponse,
  serializeActivityRequest,
} from './normalizers';

describe('normalizadores del contrato HTTP', () => {
  it('adapta la actividad del backend al modelo visual', () => {
    expect(normalizeActivity({
      id: 7,
      line: 'medioambiente',
      mode: 'PRESENCIAL',
      spots: 20,
      partnerName: 'Entidad',
      imageUrl: '/uploads/activity.png',
    })).toMatchObject({
      id: 7,
      line: 'medio_ambiente',
      mode: 'PRESENCIAL',
      modality: 'PRESENCIAL',
      capacity: 20,
      maxParticipants: 20,
      organizationName: 'Entidad',
      image: '/uploads/activity.png',
    });
  });

  it('serializa el formulario con los nombres y fechas que acepta el backend', () => {
    expect(serializeActivityRequest({
      title: 'Actividad',
      line: 'medio_ambiente',
      modality: 'presencial',
      maxParticipants: 15,
      startDate: '2026-10-10T09:00:00Z',
      endDate: '2026-10-11T12:00:00Z',
      registrationDeadline: '2026-10-08T21:59:00Z',
      image: '/uploads/activity.png',
      registeredCount: 3,
      favoritedByMe: true,
    })).toEqual({
      title: 'Actividad',
      line: 'medioambiente',
      mode: 'PRESENCIAL',
      spots: 15,
      startDate: '2026-10-10',
      endDate: '2026-10-11',
      registrationDeadline: '2026-10-08',
      imageUrl: '/uploads/activity.png',
    });
  });

  it('normaliza listas paginadas, identificadores y certificados', () => {
    const response = normalizeResponse({
      data: { content: [{ id: 8, activityId: 2 }] },
    }, normalizeRegistration);
    expect(response.data.content[0].registrationId).toBe(8);
    expect(normalizeCertificate({
      employeeName: 'Ana Gil',
      activityEndDate: '2026-09-12',
    })).toMatchObject({ fullName: 'Ana Gil', endDate: '2026-09-12' });
  });
});
