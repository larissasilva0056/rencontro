import axios from 'axios';

const base = import.meta.env.VITE_API_URL ?? '';
export const api = axios.create({ baseURL: `${base}/api` });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
export const assetUrl = (p?: string | null) => (p ? (p.startsWith('http') ? p : `${base}${p}`) : '');
export const errMsg = (e: any): string => {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join(' ') : m ?? 'Algo deu errado. Tente novamente.';
};
export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const { data } = await api.post('/uploads', fd);
  return data.url as string;
}
export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '');
export const fmtDateTime = (d?: string | null) => (d ? new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '');
