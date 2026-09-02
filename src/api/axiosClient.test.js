import axios, { AxiosError } from 'axios';
import { afterEach, describe, expect, it, vi } from 'vitest';
import axiosClient, { AUTH_UNAUTHORIZED_EVENT } from './axiosClient';
import { ApiError } from './apiError';

function successfulAdapter(data = { ok: true }) {
  return vi.fn(async (config) => ({
    config,
    data,
    headers: {},
    status: 200,
    statusText: 'OK',
  }));
}

function failingAdapter(status, data) {
  return vi.fn(async (config) => {
    const response = { config, data, headers: {}, status, statusText: 'Error' };
    throw new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, config, null, response);
  });
}

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('axiosClient', () => {
  it('uses the environment base URL and attaches the access token', async () => {
    window.localStorage.setItem('accessToken', 'valid-token');
    const adapter = successfulAdapter({ id: 7 });

    const response = await axiosClient.get('/auth/me', { adapter });
    const request = adapter.mock.calls[0][0];

    expect(request.baseURL).toBe('http://localhost:8080/api');
    expect(request.headers.Authorization).toBe('Bearer valid-token');
    expect(response.data).toEqual({ id: 7 });
  });

  it('does not send an Authorization header without a token', async () => {
    const adapter = successfulAdapter();

    await axiosClient.get('/public', { adapter });

    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined();
  });

  it('normalizes validation errors so fields can display them', async () => {
    const request = axiosClient.post('/auth/login', {}, {
      adapter: failingAdapter(422, {
        message: 'Hay campos incorrectos.',
        code: 'VALIDATION_ERROR',
        fieldErrors: { email: 'El correo no es válido.' },
      }),
    });

    await expect(request).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Revisa los datos introducidos.',
      status: 422,
      code: 'VALIDATION_ERROR',
      fieldErrors: { email: 'El correo no es válido.' },
    });
  });

  it('replaces a backend domain code with its accessible Spanish message', async () => {
    const request = axiosClient.post('/registrations', {}, {
      adapter: failingAdapter(409, {
        message: 'ACTIVITY_FULL',
        code: 'ACTIVITY_FULL',
      }),
    });

    await expect(request).rejects.toMatchObject({
      message: 'No quedan plazas disponibles para esta actividad.',
      status: 409,
      code: 'ACTIVITY_FULL',
    });
  });

  it('clears an invalid session and notifies the authentication layer on 401', async () => {
    window.localStorage.setItem('accessToken', 'expired-token');
    window.localStorage.setItem('refreshToken', 'expired-refresh-token');
    window.localStorage.setItem('user', JSON.stringify({ id: 1 }));
    axiosClient.defaults.headers.common.Authorization = 'Bearer expired-token';
    const onUnauthorized = vi.fn();
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, onUnauthorized, { once: true });

    const request = axiosClient.get('/auth/me', { adapter: failingAdapter(401, {}) });

    await expect(request).rejects.toBeInstanceOf(ApiError);
    expect(window.localStorage.getItem('accessToken')).toBeNull();
    expect(window.localStorage.getItem('refreshToken')).toBeNull();
    expect(window.localStorage.getItem('user')).toBeNull();
    expect(axiosClient.defaults.headers.common.Authorization).toBeUndefined();
    expect(onUnauthorized).toHaveBeenCalledOnce();
  });

  it('returns a comprehensible network error', async () => {
    const adapter = vi.fn(async (config) => {
      throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
    });

    await expect(axiosClient.get('/activities', { adapter })).rejects.toMatchObject({
      message: 'No se ha podido conectar con el servidor. Comprueba tu conexión.',
      status: null,
      isNetworkError: true,
    });
  });

  it('keeps cancellation distinct from connection failures', async () => {
    const adapter = vi.fn(async (config) => {
      throw new axios.CanceledError('canceled', config);
    });

    await expect(axiosClient.get('/activities', { adapter })).rejects.toMatchObject({
      code: 'ERR_CANCELED',
      isCanceled: true,
      isNetworkError: false,
    });
  });
});
