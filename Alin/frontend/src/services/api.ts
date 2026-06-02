// Central API utility — all authenticated requests go through here
const BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  get: <T>(path: string): Promise<T> =>
    fetch(`${BASE}${path}`, { headers: authHeaders() }).then(r => handle<T>(r)),

  post: <T>(path: string, body: unknown): Promise<T> =>
    fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).then(r => handle<T>(r)),

  put: <T>(path: string, body: unknown): Promise<T> =>
    fetch(`${BASE}${path}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).then(r => handle<T>(r)),

  patch: <T>(path: string, body: unknown): Promise<T> =>
    fetch(`${BASE}${path}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(body),
    }).then(r => handle<T>(r)),

  del: <T>(path: string): Promise<T> =>
    fetch(`${BASE}${path}`, {
      method: 'DELETE',
      headers: authHeaders(),
    }).then(r => handle<T>(r)),

  upload: <T>(path: string, formData: FormData): Promise<T> => {
    const token = localStorage.getItem('authToken');
    return fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(r => handle<T>(r));
  },
};
