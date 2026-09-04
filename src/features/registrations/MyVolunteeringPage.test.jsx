import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MyVolunteeringPage from './MyVolunteeringPage';
import { getMyRegistrations } from '../../api/registrationsApi';

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

const activeItems = [
  {
    registrationId: 101,
    activity: { id: 1, title: 'Acompañamiento a mayores', partner: 'Fundación Solitaria', startDate: '2026-09-10', endDate: '2026-09-17', hours: 8 },
    status: 'WAITLISTED',
    queuePosition: 3,
    reportId: null,
    reportStatus: null,
  },
  {
    registrationId: 103,
    activity: { id: 4, title: 'Jornada ambiental', partner: 'Voluntarios Activos', startDate: '2026-07-01', endDate: '2026-07-02', hours: 8 },
    status: 'WAITLISTED',
    queuePosition: 1,
    reportId: 502,
    reportStatus: 'RETURNED',
  },
];

const closedItems = [
  {
    registrationId: 104,
    activity: { id: 4, title: 'Jornada ambiental', partner: 'Voluntarios Activos', startDate: '2026-07-01', endDate: '2026-07-02', hours: 8 },
    status: 'CLOSED',
    queuePosition: null,
    reportId: 501,
    reportStatus: 'VALIDATED',
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
    getMyRegistrations.mockRejectedValueOnce(new Error('Fallo de red')).mockResolvedValueOnce({ data: { active: [], closed: [] } });
    renderPage();
    expect(await screen.findByText(/fallo de red/i)).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(await screen.findByText(/no tienes inscripciones/i)).toBeInTheDocument();
  });

  it('muestra ambos bloques vacíos cuando backend devuelve vacíos', async () => {
    getMyRegistrations.mockResolvedValue({ data: { active: [], closed: [] } });
    renderPage();
    expect(await screen.findByText(/no tienes inscripciones/i)).toBeInTheDocument();
  });

  it('renderiza bloques activos y cerrados exactamente como backend sin filtros', async () => {
    getMyRegistrations.mockResolvedValue({ data: { active: activeItems, closed: closedItems } });
    renderPage();
    expect(await screen.findByRole('heading', { name: /^activas$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^cerradas$/i })).toBeInTheDocument();
    // cada inscripción aparece en su bloque
    expect(screen.getByText('Acompañamiento a mayores')).toBeInTheDocument();
    expect(screen.getAllByText('Jornada ambiental').length).toBe(2);
    // no hay filtros
    expect(screen.queryByLabelText(/filtrar/i)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/buscar/i)).not.toBeInTheDocument();
  });

  it('muestra posición de cola y acciones pendiente según MyRegistrationItem', async () => {
    getMyRegistrations.mockResolvedValue({ data: { active: activeItems, closed: closedItems } });
    renderPage();
    await screen.findByText('Acompañamiento a mayores');
    expect(screen.getByText('Posición en cola: 3')).toBeInTheDocument();
    expect(screen.getByText('Posición en cola: 1')).toBeInTheDocument();
    // Enviar cierre si no existe informe
    const enviar = screen.getByTestId('action-enviar-101');
    expect(enviar).toHaveTextContent('Enviar cierre');
    expect(enviar).toHaveAttribute('href', expect.stringContaining('101'));
    // Corregir y reenviar si RETURNED
    const corregir = screen.getByTestId('action-corregir-103');
    expect(corregir).toHaveTextContent('Corregir y reenviar');
    expect(corregir).toHaveAttribute('href', '/reports/502');
    // Ver cierre para VALIDATED usa reportId
    const ver = screen.getByTestId('action-ver-104');
    expect(ver).toHaveAttribute('href', '/reports/501');
  });

  it('no reclasifica estados con reglas duplicadas', async () => {
    getMyRegistrations.mockResolvedValue({ data: { active: [activeItems[0]], closed: [closedItems[0]] } });
    renderPage();
    await screen.findByText('Acompañamiento a mayores');
    const activeSection = screen.getByRole('heading', { name: /^activas$/i }).closest('section');
    const closedSection = screen.getByRole('heading', { name: /^cerradas$/i }).closest('section');
    expect(activeSection).toHaveTextContent('Acompañamiento a mayores');
    expect(closedSection).toHaveTextContent('CLOSED');
    // ensure active item not in closed and vice versa
    expect(activeSection).not.toHaveTextContent('Ver cierre');
    expect(closedSection).toHaveTextContent('Ver cierre');
  });
});
