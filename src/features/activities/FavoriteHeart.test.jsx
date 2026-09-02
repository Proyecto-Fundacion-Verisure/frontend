import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CatalogPage from './CatalogPage';
import ActivityDetailPage from './ActivityDetailPage';
import { FavoritesProvider } from '../favorites/FavoritesContext';
import { getPublishedActivities, getActivityDetail, favoriteActivity, unfavoriteActivity } from '../../api/activitiesApi';
import { getMyRegistrations } from '../../api/registrationsApi';

vi.mock('../../api/activitiesApi', () => ({
  getPublishedActivities: vi.fn(),
  getActivityDetail: vi.fn(),
  getAdminActivity: vi.fn(),
  favoriteActivity: vi.fn(),
  unfavoriteActivity: vi.fn(),
  createActivity: vi.fn(),
}));

vi.mock('../../api/registrationsApi', () => ({
  getMyRegistrations: vi.fn(),
  createRegistration: vi.fn(),
  getActivityRegistrations: vi.fn(),
  acceptRegistration: vi.fn(),
  rejectRegistration: vi.fn(),
  cancelRegistration: vi.fn(),
}));

const mockActivities = [
  {
    id: 1,
    title: 'Acompañamiento a mayores',
    description: 'Desc',
    line: 'desoledad',
    mode: 'PRESENCIAL',
    capacity: 20,
    registeredCount: 8,
    organizationName: 'Org',
    favoritedByMe: false,
  },
  {
    id: 2,
    title: 'Taller educativo',
    description: 'Desc 2',
    line: 'educar',
    mode: 'ONLINE',
    capacity: 10,
    registeredCount: 2,
    organizationName: 'Org2',
    favoritedByMe: true,
  },
];

beforeEach(() => {
  getMyRegistrations.mockResolvedValue({ data: [] });
  favoriteActivity.mockReset();
  unfavoriteActivity.mockReset();
  favoriteActivity.mockResolvedValue({ data: {}, status: 204 });
  unfavoriteActivity.mockResolvedValue({ data: {}, status: 204 });
});

describe('HeartButton optimista #44', () => {
  it('tiene nombre accesible Añadir/Quitar de favoritos', async () => {
    getPublishedActivities.mockResolvedValue({ data: mockActivities, headers: { 'x-total-count': '2' } });
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <FavoritesProvider>
          <CatalogPage />
        </FavoritesProvider>
      </MemoryRouter>
    );
    expect(await screen.findByRole('button', { name: /añadir a favoritos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quitar de favoritos/i })).toBeInTheDocument();
  });

  it('POST /activities/{id}/favorite al marcar y optimista', async () => {
    getPublishedActivities.mockResolvedValue({ data: mockActivities, headers: { 'x-total-count': '2' } });
    // delay to test optimistic before resolve
    let resolveFav;
    favoriteActivity.mockImplementation(() => new Promise((res) => { resolveFav = res; }));
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <FavoritesProvider>
          <CatalogPage />
        </FavoritesProvider>
      </MemoryRouter>
    );
    await screen.findByText(/acompañamiento a mayores/i);
    const btn = screen.getByRole('button', { name: /añadir a favoritos/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    const user = userEvent.setup();
    await user.click(btn);
    // optimistic immediate
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveAttribute('aria-label', 'Quitar de favoritos');
    // still only one request, no counter
    expect(favoriteActivity).toHaveBeenCalledWith(1);
    expect(favoriteActivity).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/favoriteCount/i)).not.toBeInTheDocument();
    // resolve and keep
    resolveFav({ data: {}, status: 204 });
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'true'));
  });

  it('DELETE /activities/{id}/favorite al desmarcar', async () => {
    getPublishedActivities.mockResolvedValue({ data: mockActivities, headers: { 'x-total-count': '2' } });
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <FavoritesProvider>
          <CatalogPage />
        </FavoritesProvider>
      </MemoryRouter>
    );
    await screen.findByText(/taller educativo/i);
    const btn = screen.getByRole('button', { name: /quitar de favoritos/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    const user = userEvent.setup();
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(unfavoriteActivity).toHaveBeenCalledWith(2);
    expect(screen.queryByText(/favoriteCount/i)).not.toBeInTheDocument();
  });

  it('revierte al estado anterior si 404/409', async () => {
    getPublishedActivities.mockResolvedValue({ data: mockActivities, headers: { 'x-total-count': '2' } });
    // delay rejection to observe optimistic
    let rejectFav;
    favoriteActivity.mockImplementation(() => new Promise((_, rej) => { rejectFav = rej; }));
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <FavoritesProvider>
          <CatalogPage />
        </FavoritesProvider>
      </MemoryRouter>
    );
    await screen.findByText(/acompañamiento a mayores/i);
    const btn = screen.getByRole('button', { name: /añadir a favoritos/i });
    const user = userEvent.setup();
    await user.click(btn);
    // optimistic true before rejection
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'true'));
    expect(favoriteActivity).toHaveBeenCalledWith(1);
    rejectFav({ status: 404, message: 'No encontrado' });
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'false'));

    // 409 case — new promise
    favoriteActivity.mockImplementation(() => new Promise((_, rej) => { rejectFav = rej; }));
    await user.click(btn);
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'true'));
    rejectFav({ status: 409, message: 'Conflicto' });
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'false'));
  });

  it('evita solicitudes duplicadas mientras pendiente', async () => {
    getPublishedActivities.mockResolvedValue({ data: mockActivities, headers: { 'x-total-count': '2' } });
    let resolveFav;
    favoriteActivity.mockImplementation(() => new Promise((res) => { resolveFav = res; }));
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <FavoritesProvider>
          <CatalogPage />
        </FavoritesProvider>
      </MemoryRouter>
    );
    await screen.findByText(/acompañamiento a mayores/i);
    const btn = screen.getByRole('button', { name: /añadir a favoritos/i });
    const user = userEvent.setup();
    await user.click(btn);
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'true'));
    // second click while pending should be ignored (button disabled)
    await user.click(btn);
    expect(favoriteActivity).toHaveBeenCalledTimes(1);
    resolveFav({ status: 204 });
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'true'));
  });

  it('persiste y sincroniza entre catálogo y ficha sin contador global', async () => {
    getPublishedActivities.mockResolvedValue({ data: mockActivities, headers: { 'x-total-count': '2' } });
    getActivityDetail.mockResolvedValue({ data: { ...mockActivities[0], favoritedByMe: false } });
    render(
      <MemoryRouter initialEntries={['/activities']}>
        <FavoritesProvider>
          <Routes>
            <Route path="/activities" element={<CatalogPage />} />
            <Route path="/activities/:activityId" element={<ActivityDetailPage />} />
          </Routes>
        </FavoritesProvider>
      </MemoryRouter>
    );
    await screen.findByText(/acompañamiento a mayores/i);
    const catalogBtn = screen.getByRole('button', { name: /añadir a favoritos/i });
    const user = userEvent.setup();
    await user.click(catalogBtn);
    expect(catalogBtn).toHaveAttribute('aria-pressed', 'true');
    // navigate to detail via link
    await user.click(screen.getByRole('link', { name: /ver detalle de acompañamiento a mayores/i }));
    await screen.findByRole('heading', { name: /acompañamiento a mayores/i });
    // detail should also show favorited (shared context, not counter)
    const detailBtns = screen.getAllByRole('button', { name: /quitar de favoritos/i });
    expect(detailBtns.length).toBeGreaterThan(0);
    expect(detailBtns[0]).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByText(/favoriteCount/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+ favoritos/i)).not.toBeInTheDocument();
  });

  it('detail: toggle con error revierte y mantiene accesibilidad', async () => {
    getActivityDetail.mockResolvedValue({ data: { ...mockActivities[0], favoritedByMe: true } });
    getMyRegistrations.mockResolvedValue({ data: [] });
    let rejectUnfav;
    unfavoriteActivity.mockImplementation(() => new Promise((_, rej) => { rejectUnfav = rej; }));
    render(
      <MemoryRouter initialEntries={['/activities/1']}>
        <FavoritesProvider>
          <ActivityDetailPage />
        </FavoritesProvider>
      </MemoryRouter>
    );
    await screen.findByRole('heading', { name: /acompañamiento a mayores/i });
    const btn = (await screen.findAllByRole('button', { name: /quitar de favoritos/i }))[0];
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveAttribute('aria-label', 'Quitar de favoritos');
    const user = userEvent.setup();
    await user.click(btn);
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'false'));
    expect(btn).toHaveAttribute('aria-label', 'Añadir a favoritos');
    rejectUnfav({ status: 404, message: 'No encontrado' });
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'true'));
    expect(btn).toHaveAttribute('aria-label', 'Quitar de favoritos');
  });
});
