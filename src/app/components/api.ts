import { projectId, publicAnonKey } from '/utils/supabase/info';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-c63ea027`;

export function getAuthHeaders(token?: string | null) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || publicAnonKey}`,
  };
}

export async function apiPost(path: string, body: any, token?: string | null) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiGet(path: string, token?: string | null) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'GET',
    headers: getAuthHeaders(token),
  });
  return res.json();
}

export async function apiPut(path: string, body: any, token?: string | null) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiDelete(path: string, token?: string | null) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  return res.json();
}

export async function uploadImage(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  return res.json();
}
