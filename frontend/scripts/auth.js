// Integração Clerk — autenticação no frontend HTML puro
const CLERK_PUBLISHABLE_KEY = 'pk_test_Y2hlZXJmdWwtbXVzdGFuZy00MC5jbGVyay5hY2NvdW50cy5kZXYk';

let clerk = null;

async function initClerk() {
  // Carrega o SDK do Clerk via CDN
  await loadClerkScript();

  clerk = window.Clerk;
  await clerk.load({ publishableKey: CLERK_PUBLISHABLE_KEY });

  // Sincroniza sessão com o backend ao fazer login
  clerk.addListener(async ({ session }) => {
    if (session) {
      const token = await session.getToken();
      API.Auth.setSession(token, false); // isPremium virá do backend futuramente

      // Sincroniza usuário no banco
      try {
        await API.User.syncClerk(
          clerk.user.id,
          clerk.user.fullName,
          clerk.user.primaryEmailAddress?.emailAddress ?? null
        );
      } catch { /* ignora se já existe */ }

      updateNavUI(clerk.user);
    } else {
      API.Auth.clearSession();
      updateNavUI(null);
    }
  });

  updateNavUI(clerk.user ?? null);
}

function loadClerkScript() {
  return new Promise((resolve, reject) => {
    if (window.Clerk) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Atualiza os botões de Entrar/Registrar no header
function updateNavUI(user) {
  const loginBtn = document.querySelector('.btn-login');
  const registerBtn = document.querySelector('.btn-register');
  const userArea = document.querySelector('.user-actions');

  if (!userArea) return;

  if (user) {
    userArea.innerHTML = `
      <span style="color:#ccc;font-size:.9rem;">Olá, ${user.firstName ?? 'usuário'}</span>
      <button onclick="window.ClerkAuth.signOut()" class="btn-login" style="margin-left:12px;">Sair</button>
    `;
  } else {
    userArea.innerHTML = `
      <button onclick="window.ClerkAuth.openSignIn()" class="btn-login">Entrar</button>
      <button onclick="window.ClerkAuth.openSignUp()" class="btn-register">Registrar</button>
    `;
  }
}

// API pública exposta globalmente
window.ClerkAuth = {
  openSignIn: () => clerk?.openSignIn(),
  openSignUp: () => clerk?.openSignUp(),
  signOut: async () => {
    await clerk?.signOut();
    API.Auth.clearSession();
    window.location.reload();
  },
  getUser: () => clerk?.user ?? null,
  getToken: async () => {
    const session = clerk?.session;
    return session ? await session.getToken() : null;
  },
};

// Inicializa automaticamente
document.addEventListener('DOMContentLoaded', () => {
  initClerk().catch(console.error);
});
