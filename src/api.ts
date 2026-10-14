export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) }, ...options });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message ?? 'Có lỗi kết nối');
  return response.json();
}
