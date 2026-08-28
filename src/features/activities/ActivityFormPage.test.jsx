import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ActivityFormPage from './ActivityFormPage';

vi.mock('../../api/activitiesApi', () => ({
  createActivity: vi.fn(() => Promise.resolve({ data: { id: 1 } })),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/org/activities/new']}>
      <ActivityFormPage />
    </MemoryRouter>,
  );
}

describe('ActivityFormPage', () => {
  it('renders all form fields and preview section', () => {
    renderPage();

    expect(screen.getByLabelText(/Título/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Correo de contacto/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Descripción/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Línea/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Modalidad/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fecha/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Plazas disponibles/)).toBeInTheDocument();
    expect(screen.getAllByText('Vista previa').length).toBeGreaterThanOrEqual(1);
  });

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /Crear actividad/ }));

    expect(screen.getByText('Indica el título de la actividad.')).toBeInTheDocument();
    expect(screen.getByText('Describe la actividad.')).toBeInTheDocument();
    expect(screen.getByText('Selecciona una línea.')).toBeInTheDocument();
    expect(screen.getByText('Selecciona la modalidad.')).toBeInTheDocument();
    expect(screen.getByText('Indica una fecha.')).toBeInTheDocument();
    expect(screen.getByText('Indica el número de plazas disponible.')).toBeInTheDocument();
    expect(screen.getByText('Introduce un correo de contacto válido.')).toBeInTheDocument();
  });

  it('shows location field only when modality is presencial', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.queryByLabelText(/Ubicación/)).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/Modalidad/), 'presencial');
    expect(screen.getByLabelText(/Ubicación/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/Modalidad/), 'online');
    expect(screen.queryByLabelText(/Ubicación/)).not.toBeInTheDocument();
  });

  it('preview updates in real-time as user types', async () => {
    const user = userEvent.setup();
    renderPage();

    const titleInput = screen.getByLabelText(/Título/);
    await user.type(titleInput, 'Jornada de voluntariado');

    expect(screen.getByRole('heading', { name: 'Jornada de voluntariado' })).toBeInTheDocument();
  });

  it('validates location is required for presencial modality', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(screen.getByLabelText(/Modalidad/), 'presencial');
    await user.click(screen.getByRole('button', { name: /Crear actividad/ }));

    expect(screen.getByText('Indica la ubicación para actividades presenciales.')).toBeInTheDocument();
  });
});
