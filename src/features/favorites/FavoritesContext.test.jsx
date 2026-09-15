import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FavoritesProvider, useFavorites } from './FavoritesContext';
import { favoriteActivity, unfavoriteActivity } from '../../api/favoritesApi';

vi.mock('../../api/favoritesApi', () => ({
  favoriteActivity: vi.fn(),
  unfavoriteActivity: vi.fn(),
}));

/**
 * Consume el contexto como lo hacen la tarjeta y la ficha: lee a través de
 * `getFavorite` e `isPending`. Que lea desde dentro del proveedor es justo lo que
 * hace falta para detectar que un cambio no se propaga a quien lo consume.
 */
function Heart({ activityId = 1, serverValue = false }) {
  const { getFavorite, isPending, toggleFavorite } = useFavorites();
  const favorited = getFavorite(activityId, serverValue);
  return (
    <button
      type="button"
      onClick={() => toggleFavorite(activityId, favorited).catch(() => {})}
      data-testid="heart"
      data-favorited={String(favorited)}
      data-pending={String(isPending(activityId))}
    >
      corazón
    </button>
  );
}

const renderHeart = (props) => render(
  <FavoritesProvider>
    <Heart {...props} />
  </FavoritesProvider>,
);

const heart = () => screen.getByTestId('heart');

beforeEach(() => {
  favoriteActivity.mockReset();
  unfavoriteActivity.mockReset();
});

describe('FavoritesProvider', () => {
  it('pinta el corazón antes de que conteste el servidor', async () => {
    let resolve;
    favoriteActivity.mockReturnValue(new Promise((r) => { resolve = r; }));
    const user = userEvent.setup();
    renderHeart();

    await user.click(heart());

    expect(heart()).toHaveAttribute('data-favorited', 'true');
    expect(heart()).toHaveAttribute('data-pending', 'true');
    resolve({});
    await waitFor(() => expect(heart()).toHaveAttribute('data-pending', 'false'));
  });

  // La regresión: `pendingRef` era una `ref`, así que al terminar bien nadie
  // volvía a renderizar y el spinner se quedaba encendido para siempre.
  it('deja de estar pendiente al quitar el favorito, no solo al ponerlo', async () => {
    unfavoriteActivity.mockResolvedValue({ status: 204 });
    const user = userEvent.setup();
    renderHeart({ serverValue: true });

    await user.click(heart());

    await waitFor(() => expect(heart()).toHaveAttribute('data-pending', 'false'));
    expect(heart()).toHaveAttribute('data-favorited', 'false');
  });

  it('devuelve el corazón a su sitio si el servidor falla', async () => {
    favoriteActivity.mockRejectedValue({ status: 500 });
    const user = userEvent.setup();
    renderHeart();

    await user.click(heart());

    await waitFor(() => expect(heart()).toHaveAttribute('data-favorited', 'false'));
    expect(heart()).toHaveAttribute('data-pending', 'false');
  });

  it('trata el 409 de marcar dos veces como éxito', async () => {
    favoriteActivity.mockRejectedValue({ status: 409, code: 'ALREADY_FAVORITED' });
    const user = userEvent.setup();
    renderHeart();

    await user.click(heart());

    await waitFor(() => expect(heart()).toHaveAttribute('data-pending', 'false'));
    expect(heart()).toHaveAttribute('data-favorited', 'true');
  });

  it('trata el 404 de desmarcar algo que ya no estaba como éxito', async () => {
    unfavoriteActivity.mockRejectedValue({ status: 404 });
    const user = userEvent.setup();
    renderHeart({ serverValue: true });

    await user.click(heart());

    await waitFor(() => expect(heart()).toHaveAttribute('data-pending', 'false'));
    expect(heart()).toHaveAttribute('data-favorited', 'false');
  });

  it('no manda dos peticiones si se pulsa dos veces seguidas', async () => {
    let resolve;
    favoriteActivity.mockReturnValue(new Promise((r) => { resolve = r; }));
    const user = userEvent.setup();
    renderHeart();

    await user.click(heart());
    await user.click(heart());

    expect(favoriteActivity).toHaveBeenCalledTimes(1);
    resolve({});
    await waitFor(() => expect(heart()).toHaveAttribute('data-pending', 'false'));
  });
});
