const API = import.meta.env.VITE_API_BASE_URL || '/api';

export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at?: string;
}

export async function loginUser(email: string, password: string) {
  try {
    const response = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed. Please check your credentials.');
    }

    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userRole', data.role);
    localStorage.setItem('userName', data.name);
    return data;
  } catch (error) {
    throw error;
  }
}

export async function registerUser(name: string, email: string, password: string, role: string) {
  try {
    const response = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!response.ok) {
      throw new Error('Registration failed. Please try again.');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

export function logoutUser() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
}

export function getCurrentUser() {
  const token = localStorage.getItem('authToken');
  if (!token) return null;

  return {
    name: localStorage.getItem('userName') || '',
    role: localStorage.getItem('userRole') || '',
  };
}

export function isLoggedIn() {
  const token = localStorage.getItem('authToken');
  return token !== null;
}
