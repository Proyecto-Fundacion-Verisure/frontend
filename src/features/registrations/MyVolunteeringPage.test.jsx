import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyVolunteeringPage from './MyVolunteeringPage';
import { cancelRegistration, getMyRegistrations } from '../../api/registrationsApi';

vi.mock('../../api/registrationsApi', () => ({
  getMyRegistrations: vi.fn(),
  createRegistration: vi.fn(),
  getActivityRegistrations: vi.fn(),
  acceptRegistration: vi.fn(),
  rejectRegistration: vi.fn(),
  cancelRegistration: vi.fn(),
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <MyVolunteeringPage />
    </MemoryRouter>
  );
}

// Las fechas van relativas a hoy a propósito. La versión anterior de este fichero
// las tenía fijas, y el día que el calendario alcanzó a `startDate` tres pruebas
// se cayeron solas: la actividad había empezado y el botón de cancelar dejó de
// pintarse. Una fixture con fecha fija caduca.
const isoDaysFromToday = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('sv');
};

const STARTS_IN_A_WEEK = isoDaysFromToday(7);
const STARTS_TODAY = isoDaysFromToday(0);
const STARTED_YESTERDAY = isoDaysFromToday(-1);

const activeItems = [
  {
    registrationId: 101,
    activity: { id: 1, title: 'Acompañamiento a mayores', partner: 'Fundación Solitaria', startDate: STARTS_IN_A_WEEK, endDate: isoDaysFromToday(14), hours: 8 },
    status: 'WAITLISTED',
    queuePosition: 3,
    accepted: false,
    closureId: null,
    activityClosed: false,
  },
  {
    registrationId: 103,
    activity: { id: 4, title: 'Jornada ambiental', partner: 'Voluntarios Activos', startDate: '2026-07-01', endDate: '2026-07-02', hours: 8 },
    status: 'WAITLISTED',
    queuePosition: 1,
    accepted: true,
    closureId: null,
    activityClosed: false,
  },
  {
    registrationId: 105,
    activity: { id: 5, title: 'Mentoría terminada', partner: 'Educamos Juntos', startDate: '2026-07-01', endDate: '2026-07-02', hours: 8 },
    status: 'PENDING_CLOSURE',
    accepted: true,
    closureId: null,
    activityClosed: false,
  },
  {
    registrationId: 106,
    activity: { id: 6, title: 'Cierre enviado', partner: 'Fundación Cerca', startDate: '2026-07-01', endDate: '2026-07-02', hours: 4 },
    status: 'PENDING_CLOSURE',
    accepted: true,
    closureId: 502,
    activityClosed: false,
  },
];

const closedItems = [
  {
    registrationId: 104,
    activity: { id: 4, title: 'Jornada ambiental', partner: 'Voluntarios Activos', startDate: '2026-07-01', endDate: '2026-07-02', hours: 8 },
    status: 'CLOSED',
    queuePosition: null,
    closureId: 501,
    activityClosed: true,
  },
];

beforeEach(() => {
  getMyRegistrations.mockReset();
});

describe('MyVolunteeringPage', () => {
  it('muestra carga inicial', () => {
    getMyRegistrations.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByRole('status', { name: /cargando inscripciones/i })).toBeInTheDocument();
  });

  it('maneja 401 con mensaje de sesión expirada', async () => {
    getMyRegistrations.mockRejectedValue({ status: 401, message: 'Unauthorized' });
    renderPage();
    expect(await screen.findByText(/sesión ha expirado/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /iniciar sesión/i })).toHaveAttribute('href', '/login');
  });

  it('maneja error con reintentar', async () => {
    getMyRegistrations.mockRejectedValueOnce(new Error('Fallo de red')).mockResolvedValueOnce({ data: [] });
    renderPage();
    expect(await screen.findByText(/fallo de red/i)).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(await screen.findByText(/no tienes inscripciones/i)).toBeInTheDocument();
  });

  it('muestra ambos bloques vacíos cuando backend devuelve vacíos', async () => {
    getMyRegistrations.mockResolvedValue({ data: [] });
    renderPage();
    expect(await screen.findByText(/no tienes inscripciones/i)).toBeInTheDocument();
  });

  it('separa la lista plana del backend en bloques activos y cerrados', async () => {
    getMyRegistrations.mockResolvedValue({ data: [...activeItems, ...closedItems] });
    renderPage();
    expect(await screen.findByRole('heading', { name: /^activas$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^cerradas$/i })).toBeInTheDocument();
    // cada inscripción aparece en su bloque
    expect(screen.getByText('Acompañamiento a mayores')).toBeInTheDocument();
    expect(screen.getAllByText('Jornada ambiental')).toHaveLength(2);
    // no hay filtros
    expect(screen.queryByLabelText(/filtrar/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/buscar/i)).not.toBeInTheDocument();
  });

  it('muestra posición de cola y acciones pendiente según MyRegistrationItem', async () => {
    getMyRegistrations.mockResolvedValue({ data: [...activeItems, ...closedItems] });
    renderPage();
    await screen.findByText('Acompañamiento a mayores');
    expect(screen.getByText('Posición en cola: 3')).toBeInTheDocument();
    expect(screen.getByText('Posición en cola: 1')).toBeInTheDocument();
    const enviar = screen.getByTestId('action-enviar-105');
    expect(enviar).toHaveTextContent('Cerrar tu participación');
    expect(enviar).toHaveAttribute('href', '/closures/new?registrationId=105');
    expect(screen.getByTestId('action-ver-106')).toHaveAttribute('href', '/closures/502');
    expect(screen.getByTestId('action-cert-104')).toHaveAttribute('href', '/closures/501/certificate');
  });

  it('no reclasifica estados con reglas duplicadas', async () => {
    getMyRegistrations.mockResolvedValue({ data: [activeItems[0], closedItems[0]] });
    renderPage();
    await screen.findByText('Acompañamiento a mayores');
    const activeSection = screen.getByRole('heading', { name: /^activas$/i }).closest('section');
    const closedSection = screen.getByRole('heading', { name: /^cerradas$/i }).closest('section');
    expect(activeSection).toHaveTextContent('Acompañamiento a mayores');
    expect(closedSection).toHaveTextContent(/cerrado/i);
    // ensure active item not in closed and vice versa
    expect(activeSection).not.toHaveTextContent('Ver cierre');
    expect(closedSection).toHaveTextContent('Descargar certificado');
  });

  it('diferencia aceptada de todavía sin revisar via accepted', async () => {
    getMyRegistrations.mockResolvedValue({ data: activeItems });
    renderPage();
    await screen.findByText('Acompañamiento a mayores');
    // 101 accepted false -> Pendiente de revisión
    expect(screen.getByTestId('accepted-101')).toHaveTextContent('Pendiente de revisión');
    // 103 accepted true -> Aceptada
    expect(screen.getByTestId('accepted-103')).toHaveTextContent('Aceptada');
    // queuePosition lee directamente de backend, no calculada
    expect(screen.getByText('Posición en cola: 3')).toBeInTheDocument();
    expect(screen.getByText('Posición en cola: 1')).toBeInTheDocument();
  });

  it('actualiza posición tras promoción o cancelación', async () => {
    const first = { ...activeItems[0], queuePosition: 3, accepted: false };
    const promoted = { ...activeItems[0], queuePosition: 2, accepted: true };
    getMyRegistrations.mockResolvedValueOnce({ data: [first] });
    getMyRegistrations.mockResolvedValueOnce({ data: [promoted] });
    cancelRegistration.mockResolvedValue({ data: { registrationId: 999, status: 'CANCELLED' } });
    renderPage();
    expect(await screen.findByText('Posición en cola: 3')).toBeInTheDocument();
    expect(screen.getByTestId('accepted-101')).toHaveTextContent('Pendiente de revisión');
    const user = userEvent.setup();
    await user.click(screen.getByTestId('cancel-101'));
    expect(await screen.findByText(/¿Seguro que quieres cancelar/)).toBeInTheDocument();
    await user.click(screen.getByTestId('confirm-cancel-101'));
    await waitFor(() => expect(screen.getByText('Posición en cola: 2')).toBeInTheDocument());
    expect(screen.getByTestId('accepted-101')).toHaveTextContent('Aceptada');
    expect(cancelRegistration).toHaveBeenCalledWith(101);
    expect(cancelRegistration).toHaveBeenCalledTimes(1);
  });

  it('cancelar modal no modifica datos', async () => {
    getMyRegistrations.mockResolvedValue({ data: [activeItems[0]] });
    renderPage();
    await screen.findByText('Acompañamiento a mayores');
    const user = userEvent.setup();
    await user.click(screen.getByTestId('cancel-101'));
    expect(await screen.findByText(/¿Seguro que quieres cancelar/)).toBeInTheDocument();
    await user.click(screen.getByTestId('modal-cancel-101'));
    expect(cancelRegistration).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Posición en cola: 3')).toBeInTheDocument();
  });

  it('deja cancelar el mismo día de inicio, como hace el backend', async () => {
    // El backend usa `LocalDate.now().isAfter(startDate)`: el propio día de inicio
    // todavía se puede cancelar. La pantalla comparaba con `new Date()` y se
    // adelantaba un día, ocultando el botón a quien aún estaba a tiempo.
    const startsToday = { registrationId: 203, activity: { id: 12, title: 'Empieza hoy', partner: 'P', startDate: STARTS_TODAY, endDate: isoDaysFromToday(3), hours: 2 }, status: 'CONFIRMED', queuePosition: null, accepted: true };
    const startedYesterday = { registrationId: 204, activity: { id: 13, title: 'Empezó ayer', partner: 'P', startDate: STARTED_YESTERDAY, endDate: isoDaysFromToday(3), hours: 2 }, status: 'CONFIRMED', queuePosition: null, accepted: true };
    getMyRegistrations.mockResolvedValue({ data: [startsToday, startedYesterday] });
    renderPage();
    await screen.findByText('Empieza hoy');
    expect(screen.getByTestId('cancel-203')).toBeInTheDocument();
    expect(screen.queryByTestId('cancel-204')).not.toBeInTheDocument();
  });

  it('ejecuta un solo PATCH al confirmar y oculta acción tras fecha de inicio', async () => {
    const future = { registrationId: 201, activity: { id: 10, title: 'Futura', partner: 'P', startDate: '2099-01-01', endDate: '2099-01-02', hours: 2 }, status: 'WAITLISTED', queuePosition: 2, accepted: false };
    const past = { registrationId: 202, activity: { id: 11, title: 'Pasada', partner: 'P', startDate: '2020-01-01', endDate: '2020-01-02', hours: 2 }, status: 'WAITLISTED', queuePosition: 2, accepted: false };
    getMyRegistrations.mockResolvedValue({ data: [future, past] });
    let resolveCancel;
    cancelRegistration.mockImplementation(() => new Promise((res) => { resolveCancel = res; }));
    renderPage();
    await screen.findByText('Futura');
    expect(screen.getByTestId('cancel-201')).toBeInTheDocument();
    expect(screen.queryByTestId('cancel-202')).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByTestId('cancel-201'));
    await screen.findByText(/¿Seguro que quieres cancelar/);
    await user.click(screen.getByTestId('confirm-cancel-201'));
    await user.click(screen.getByTestId('confirm-cancel-201'));
    expect(cancelRegistration).toHaveBeenCalledTimes(1);
    resolveCancel({ data: { registrationId: 201, status: 'CANCELLED' } });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('trata DEADLINE_PASSED y NOT_OWNER sin cambiar interfaz', async () => {
    getMyRegistrations.mockResolvedValue({ data: [activeItems[0]] });
    renderPage();
    await screen.findByText('Acompañamiento a mayores');
    const user = userEvent.setup();
    // DEADLINE_PASSED es 400, no 409. El 409 del contrato es ALREADY_REGISTERED,
    // que cancelar no devuelve nunca.
    cancelRegistration.mockRejectedValueOnce({ status: 400, code: 'DEADLINE_PASSED', message: 'Plazo cerrado' });
    await user.click(screen.getByTestId('cancel-101'));
    await screen.findByText(/¿Seguro que quieres cancelar/);
    await user.click(screen.getByTestId('confirm-cancel-101'));
    expect(await screen.findByText(/Plazo cerrado/)).toBeInTheDocument();
    expect(screen.getByText('Posición en cola: 3')).toBeInTheDocument();
    // NOT_OWNER 403
    cancelRegistration.mockRejectedValueOnce({ status: 403, code: 'NOT_OWNER', message: 'No tienes permiso' });
    await user.click(screen.getByTestId('cancel-101'));
    await screen.findByText(/¿Seguro que quieres cancelar/);
    await user.click(screen.getByTestId('confirm-cancel-101'));
    expect(await screen.findByText(/No tienes permiso/)).toBeInTheDocument();
    expect(cancelRegistration).toHaveBeenCalledTimes(2);
    // No DELETE, solo PATCH
    expect(cancelRegistration).toHaveBeenCalledWith(101);
  });
});
