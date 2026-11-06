import { beforeEach, describe, expect, it, vi } from 'vitest';
import { favoriteActivity, unfavoriteActivity } from './favoritesApi';

const { client } = vi.hoisted(() => ({
  client: {
    delete: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('../../../shared/api/axiosClient', () => ({ default: client }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('favorites API contract', () => {
  it('uses the dedicated favorite routes', () => {
    favoriteActivity(8);
    unfavoriteActivity(8);

    expect(client.post).toHaveBeenCalledWith('/favorites', { activityId: 8 });
    expect(client.delete).toHaveBeenCalledWith('/favorites/8');
  });
});
