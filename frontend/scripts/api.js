// Cliente de API — conecta o frontend ao backend tRPC
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api/trpc'
  : '/api/trpc';

// Pega token do Clerk (live) ou do localStorage (fallback)
async function getAuthToken() {
  if (window.ClerkAuth?.getToken) {
    const token = await window.ClerkAuth.getToken();
    if (token) return token;
  }
  return localStorage.getItem('clerk_token') || null;
}

async function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const token = await getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// Chama uma query tRPC (GET)
async function trpcQuery(procedure, input = {}) {
  const params = new URLSearchParams({ input: JSON.stringify({ json: input }) });
  const res = await fetch(`${API_URL}/${procedure}?${params}`, {
    method: 'GET',
    headers: await buildHeaders(),
  });

  if (!res.ok) throw new Error(`Erro ${res.status} em ${procedure}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result?.data?.json ?? data.result?.data;
}

// Chama uma mutation tRPC (POST)
async function trpcMutation(procedure, input = {}) {
  const res = await fetch(`${API_URL}/${procedure}`, {
    method: 'POST',
    headers: await buildHeaders(),
    body: JSON.stringify({ json: input }),
  });

  if (!res.ok) throw new Error(`Erro ${res.status} em ${procedure}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.result?.data?.json ?? data.result?.data;
}

// ─── Manga ────────────────────────────────────────────────────────────────────

const MangaAPI = {
  list: (opts = {}) => trpcQuery('manga.list', opts),
  bySlug: (slug) => trpcQuery('manga.bySlug', { slug }),
  chapter: (mangaId, chapterNumber) => trpcQuery('manga.chapter', { mangaId, chapterNumber }),
  markRead: (mangaId, chapterId, lastReadPage = 0) =>
    trpcMutation('manga.markRead', { mangaId, chapterId, lastReadPage }),
  toggleFavorite: (mangaId) => trpcMutation('manga.toggleFavorite', { mangaId }),
};

// ─── Usuário ──────────────────────────────────────────────────────────────────

const UserAPI = {
  me: () => trpcQuery('user.me'),
  syncClerk: (clerkId, name, email) =>
    trpcMutation('user.syncClerk', { clerkId, name, email }),
  verifyCPF: (cpf, birthDate) => trpcMutation('user.verifyCPF', { cpf, birthDate }),
  notificationPreferences: () => trpcQuery('user.notificationPreferences'),
  updateNotificationPreferences: (prefs) =>
    trpcMutation('user.updateNotificationPreferences', prefs),
};

// ─── Auth (Clerk simplificado) ────────────────────────────────────────────────

const Auth = {
  isLoggedIn: () => !!getAuthToken(),

  isPremium: () => localStorage.getItem('is_premium') === 'true',

  setSession: (token, isPremium = false) => {
    localStorage.setItem('clerk_token', token);
    localStorage.setItem('is_premium', isPremium ? 'true' : 'false');
  },

  clearSession: () => {
    localStorage.removeItem('clerk_token');
    localStorage.removeItem('is_premium');
  },
};

// ─── Verificação de saúde do backend ─────────────────────────────────────────

async function checkBackendHealth() {
  try {
    const res = await fetch('http://localhost:3001/health');
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

// Expor globalmente
window.API = { Manga: MangaAPI, User: UserAPI, Auth, checkBackendHealth };
