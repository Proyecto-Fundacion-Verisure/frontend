import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPublishedActivities } from '../../api/activitiesApi';
import CatalogPage from './CatalogPage';

vi.mock('../../api/activitiesApi', () => ({
  getPublishedActivities: vi.fn(),
}));

const mockActivities = [
  {
    id: 1,
    title: 'Acompañamiento a mayores',
    description: 'Visitas semanales.',
    line: 'desoledad',
    mode: 'PRESENCIAL',
    capacity: 20,
    registeredCount: 8,
    organizationName: 'Fundación Solitaria',
    favoritedByMe: true,
  },
  {
    id: 2,
    title: 'Taller educativo',
    description: 'Formación para jóvenes.',
    line: 'educar',
    mode: 'ONLINE',
    capacity: 10,
    registeredCount: 10,
    organizationName: 'Educamos Juntos',
    favoritedByMe: false,
  },
];

function renderCatalog(initialEntries = ['/activities']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <CatalogPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  getPublishedActivities.mockReset();
});

describe('CatalogPage', () => {
  it('muestra carga inicial', () => {
    getPublishedActivities.mockReturnValue(new Promise(() => {}));
    renderCatalog();
    expect(screen.getByLabelText(/cargando catálogo/i)).toBeInTheDocument();
  });

  it('muestra error con reintentar', async () => {
    getPublishedActivities.mockRejectedValueOnce(new Error('Fallo de red')).mockResolvedValueOnce({
      data: mockActivities,
      headers: { 'x-total-count': '2' },
    });
    renderCatalog();

    expect(await screen.findByText(/Fallo de red/i)).toBeInTheDocument();
    expect(getPublishedActivities).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 12 }));
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /reintentar/i }));
    expect(await screen.findByText(/acompañamiento a mayores/i)).toBeInTheDocument();
  });

  it('muestra vacío cuando no hay actividades', async () => {
    getPublishedActivities.mockResolvedValue({ data: [], headers: { 'x-total-count': '0' } });
    renderCatalog();
    expect(await screen.findByText(/no hay actividades/i)).toBeInTheDocument();
  });

  it('renderiza la rejilla con plazas ocupadas y favoritedByMe sin favoriteCount', async () => {
    getPublishedActivities.mockResolvedValue({ data: mockActivities, headers: { 'x-total-count': '2' } });
    renderCatalog();

    expect(await screen.findByText(/acompañamiento a mayores/i)).toBeInTheDocument();
    expect(screen.getByText(/taller educativo/i)).toBeInTheDocument();
    expect(screen.getByText('8 de 20 plazas')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quitar de favoritos/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /añadir a favoritos/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.queryByText(/favoriteCount/i)).not.toBeInTheDocument();
    expect(getPublishedActivities).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 12 }));
    expect(getPublishedActivities).not.toHaveBeenCalledWith(expect.objectContaining({ favoriteCount: expect.anything() }));
  });

  it('filtra por line, mode y q sin usar endpoint administrativo', async () => {
    getPublishedActivities.mockResolvedValue({ data: mockActivities, headers: { 'x-total-count': '2' } });
    const user = userEvent.setup();
    renderCatalog();
    await screen.findByText(/acompañamiento a mayores/i);

    await user.selectOptions(screen.getByLabelText(/^línea$/i), 'desoledad');
    expect(await screen.findByText(/acompañamiento a mayores/i)).toBeInTheDocument();
    expect(getPublishedActivities).toHaveBeenLastCalledWith(expect.objectContaining({ line: 'desoledad', page: 1 }));

    await user.selectOptions(screen.getByLabelText(/modalidad/i), 'ONLINE');
    expect(getPublishedActivities).toHaveBeenLastCalledWith(expect.objectContaining({ line: 'desoledad', mode: 'ONLINE', page: 1 }));
  });

  it('pagina en escritorio con Page y x-total-count', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ ...mockActivities[0], id: i + 1, title: `Act ${i + 1}` }));
    getPublishedActivities.mockResolvedValue({ data: many, headers: { 'x-total-count': '24' } });
    const user = userEvent.setup();
    renderCatalog();

    expect(await screen.findByText(/página 1 de 2/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(await screen.findByText(/página 2 de 2/i)).toBeInTheDocument();
    expect(getPublishedActivities).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }));
    expect(screen.getByRole('button', { name: /siguiente/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /anterior/i }));
    expect(await screen.findByText(/página 1 de 2/i)).toBeInTheDocument();
  });

  it('sincroniza filtros y búsqueda con la URL y normaliza inválidos', async () => {
    getPublishedActivities.mockResolvedValue({ data: mockActivities, headers: { 'x-total-count': '2' } });
    renderCatalog(['/activities?line=desoledad&mode=ONLINE&q=mayores&page=2']);

    expect(await screen.findByText(/acompañamiento a mayores/i)).toBeInTheDocument();
    expect(getPublishedActivities).toHaveBeenCalledWith(
      expect.objectContaining({ line: 'desoledad', mode: 'ONLINE', q: 'mayores', page: 2 }),
    );
    expect(screen.getByLabelText(/^línea$/i)).toHaveValue('desoledad');
    expect(screen.getByLabelText(/modalidad/i)).toHaveValue('ONLINE');
    expect(screen.getByLabelText(/buscar/i)).toHaveValue('mayores');
  });

  it('normaliza valores inválidos a los predeterminados', async () => {
    getPublishedActivities.mockResolvedValue({ data: mockActivities, headers: { 'x-total-count': '2' } });
    renderCatalog(['/activities?line=INVALID&mode=bad&page=abc']);

    expect(await screen.findByText(/acompañamiento a mayores/i)).toBeInTheDocument();
    expect(getPublishedActivities).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    expect(getPublishedActivities).not.toHaveBeenCalledWith(expect.objectContaining({ line: 'INVALID' }));
    expect(getPublishedActivities).not.toHaveBeenCalledWith(expect.objectContaining({ mode: 'bad' }));
    expect(screen.getByLabelText(/^línea$/i)).toHaveValue('');
    expect(screen.getByLabelText(/modalidad/i)).toHaveValue('');
  });

  it('reinicia la página al cambiar filtros', async () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ ...mockActivities[0], id: i + 1, title: `Act ${i + 1}` }));
    getPublishedActivities.mockResolvedValue({ data: many, headers: { 'x-total-count': '24' } });
    const user = userEvent.setup();
    renderCatalog(['/activities?page=2']);
    expect(await screen.findByText(/página 2 de 2/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/^línea$/i), 'educar');
    expect(await screen.findByText(/página 1 de/i)).toBeInTheDocument();
    expect(getPublishedActivities).toHaveBeenLastCalledWith(expect.objectContaining({ line: 'educar', page: 1 }));
  });
});
