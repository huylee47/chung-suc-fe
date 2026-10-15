const defaultApiUrl = typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'https://chung-suc-be.onrender.com/api'
  : 'http://localhost:4000/api';
export const API_URL = import.meta.env.VITE_API_URL ?? defaultApiUrl;

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) }, ...options });
  const raw = await response.text();
  let body: T & { message?: string } | null = null;
  try { body = raw ? JSON.parse(raw) : null; } catch { body = null; }
  if (!response.ok) throw new Error(body?.message ?? `Có lỗi kết nối (${response.status})`);
  if (!body) throw new Error('Máy chủ trả về dữ liệu rỗng');
  return body;
}
