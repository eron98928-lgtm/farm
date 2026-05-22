// Script principal do MangaReader

document.addEventListener('DOMContentLoaded', async function () {
  initImageFallbacks();
  initAnimations();
  initHeaderScroll();
  init3DTilt();
  initSearch();
  initNewsletter();
  await loadMangaList();
});

// ─── Fallback para imagens quebradas ──────────────────────────────────────────

const IMG_FALLBACK_COLORS = ['#7c5cbf','#9b7fd4','#f093fb','#4facfe','#43e97b','#667eea'];

function makeFallbackSvg(text = '?', index = 0) {
  const bg = IMG_FALLBACK_COLORS[index % IMG_FALLBACK_COLORS.length];
  const initials = text.substring(0, 2).toUpperCase();
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='450' viewBox='0 0 300 450'>
    <defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' style='stop-color:${bg}'/>
      <stop offset='100%' style='stop-color:#0d0d14'/>
    </linearGradient></defs>
    <rect width='300' height='450' fill='url(%23g)'/>
    <text x='150' y='240' font-family='sans-serif' font-size='60' font-weight='bold' fill='rgba(255,255,255,0.4)' text-anchor='middle' dominant-baseline='middle'>${initials}</text>
  </svg>`;
  return `data:image/svg+xml,${svg}`;
}

function initImageFallbacks() {
  document.querySelectorAll('img').forEach((img, i) => {
    if (!img.dataset.fallbackSet) {
      img.dataset.fallbackSet = '1';
      const alt = img.getAttribute('alt') || '?';
      img.addEventListener('error', function onErr() {
        img.removeEventListener('error', onErr);
        img.src = makeFallbackSvg(alt, i);
      });
    }
  });
}


// ─── Animação dos cards ───────────────────────────────────────────────────────

function initAnimations() {
  const cards = document.querySelectorAll('.manga-card, .manga-list-item');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
  });
}

// ─── Controle dinâmico do Header no Scroll ──────────────────────────────────────

function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// ─── Busca ────────────────────────────────────────────────────────────────────

function initSearch() {
  const searchInput = document.querySelector('.search-box input');
  const searchButton = document.querySelector('.search-box button');

  async function doSearch() {
    const query = searchInput?.value.trim();
    if (!query) return;

    searchButton.disabled = true;
    searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    try {
      const results = await API.Manga.list({ search: query, limit: 10 });
      renderSearchResults(results, query);
    } catch {
      showToast('Não foi possível conectar ao servidor. Tente novamente.', 'error');
    } finally {
      searchButton.disabled = false;
      searchButton.innerHTML = '<i class="fas fa-search"></i>';
    }
  }

  searchButton?.addEventListener('click', doSearch);
  searchInput?.addEventListener('keypress', e => e.key === 'Enter' && doSearch());
}

function renderSearchResults(results, query) {
  if (!results || results.length === 0) {
    showToast(`Nenhum resultado para "${query}".`, 'info');
    return;
  }

  const existing = document.getElementById('search-results');
  if (existing) existing.remove();

  const section = document.createElement('section');
  section.id = 'search-results';
  section.className = 'featured';
  section.innerHTML = `
    <div class="container">
      <h2 class="section-title"><i class="fas fa-search"></i> Resultados para "${query}"</h2>
      <div class="manga-grid">
        ${results.map(m => `
          <div class="manga-card featured-card">
            <div class="manga-cover">
              <img src="${m.coverImage || `https://via.placeholder.com/300x450/667eea/ffffff?text=${encodeURIComponent(m.title)}`}" alt="${m.title}">
              ${m.isPremium ? '<span class="badge hot">Premium</span>' : ''}
            </div>
            <div class="manga-info">
              <h3>${m.title}</h3>
              <p class="genre">${Array.isArray(m.genres) ? m.genres.join(', ') : ''}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  document.querySelector('.featured')?.insertAdjacentElement('beforebegin', section);
  section.scrollIntoView({ behavior: 'smooth' });
}

// ─── Carregar lista de mangás da API ─────────────────────────────────────────

async function loadMangaList() {
  const healthy = await API.checkBackendHealth();
  if (!healthy) return; // usa os cards estáticos do HTML

  try {
    const mangas = await API.Manga.list({ limit: 5 });
    if (!mangas || mangas.length === 0) return;

    const listContainer = document.querySelector('.manga-list');
    if (!listContainer) return;

    listContainer.innerHTML = mangas.map((m, idx) => `
      <div class="manga-list-item">
        <span class="rank">${idx + 1}</span>
        <img src="${m.coverImage || ''}" alt="${m.title}">
        <div class="list-info">
          <h4>${m.title}</h4>
          <p>${m.author ? `por ${m.author}` : 'Último capítulo disponível'}</p>
          <span class="time">${m.status === 'ongoing' ? 'Em andamento' : 'Completo'}</span>
        </div>
        <a href="reader.html?manga=${m.slug}" class="btn-read">Ler</a>
      </div>
    `).join('');
    initImageFallbacks();
  } catch {
    // mantém HTML estático em caso de falha
  }
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

function initNewsletter() {
  const form = document.querySelector('.newsletter-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = this.querySelector('input[type="email"]').value;
    if (!email) return;

    showToast(`Inscrição realizada! Confira seu email: ${email}`, 'success');
    this.reset();
  });
}

// ─── Favoritos (sincroniza com a API quando logado) ───────────────────────────

const Favorites = {
  toggle: async function (mangaId) {
    if (API.Auth.isLoggedIn()) {
      try {
        const result = await API.Manga.toggleFavorite(Number(mangaId));
        return result.favorited;
      } catch {
        return this._toggleLocal(mangaId);
      }
    }
    return this._toggleLocal(mangaId);
  },

  _toggleLocal: function (mangaId) {
    const all = this.getAll();
    const idx = all.indexOf(String(mangaId));
    if (idx >= 0) {
      all.splice(idx, 1);
      localStorage.setItem('mangaFavorites', JSON.stringify(all));
      return false;
    }
    all.push(String(mangaId));
    localStorage.setItem('mangaFavorites', JSON.stringify(all));
    return true;
  },

  getAll: function () {
    return JSON.parse(localStorage.getItem('mangaFavorites') || '[]');
  },

  isFavorite: function (mangaId) {
    return this.getAll().includes(String(mangaId));
  },
};

// ─── Histórico de leitura ─────────────────────────────────────────────────────

const ReadingHistory = {
  add: async function (mangaId, chapterId, page = 0) {
    if (API.Auth.isLoggedIn()) {
      try {
        await API.Manga.markRead(Number(mangaId), Number(chapterId), page);
      } catch { /* fallback local */ }
    }

    const history = this.getAll();
    const idx = history.findIndex(h => h.mangaId === String(mangaId));
    const entry = { mangaId: String(mangaId), chapterId: String(chapterId), page, lastRead: new Date().toISOString() };

    if (idx >= 0) history[idx] = entry;
    else history.unshift(entry);

    localStorage.setItem('readingHistory', JSON.stringify(history.slice(0, 50)));
  },

  getAll: function () {
    return JSON.parse(localStorage.getItem('readingHistory') || '[]');
  },
};

// ─── Toast de notificação ─────────────────────────────────────────────────────

function showToast(message, type = 'info') {
  const existing = document.getElementById('mr-toast');
  if (existing) existing.remove();

  const colors = { info: '#667eea', success: '#43e97b', error: '#fa7094' };
  const toast = document.createElement('div');
  toast.id = 'mr-toast';
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 24px; right: 24px; z-index: 99999;
    background: ${colors[type] ?? colors.info}; color: #fff;
    padding: 14px 20px; border-radius: 8px; font-size: 0.95rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    transition: opacity 0.4s; max-width: 360px;
  `;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 3500);
}

// ─── Efeito de Inclinação 3D Interativo nos Cards ──────────────────────────────

function init3DTilt() {
  // Efeito tilt em 3D apenas para dispositivos que possuem mouse (evita bugs em touch)
  if (window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', function(e) {
      const card = e.target.closest('.manga-card');
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // Posição X relativa dentro do card
      const y = e.clientY - rect.top;  // Posição Y relativa dentro do card

      // Calcula as porcentagens
      const percentX = x / rect.width;
      const percentY = y / rect.height;

      // Variáveis CSS de coordenadas do mouse para o glare dinâmico
      card.style.setProperty('--mouse-x', `${percentX * 100}%`);
      card.style.setProperty('--mouse-y', `${percentY * 100}%`);

      // Calcula as rotações (máximo de 15 graus de inclinação)
      const rotateX = (0.5 - percentY) * 20;
      const rotateY = (percentX - 0.5) * 20;

      card.classList.add('is-tilting');
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
    });

    document.addEventListener('mouseout', function(e) {
      const card = e.target.closest('.manga-card');
      if (!card) return;

      // Restaura o estado padrão de forma extremamente suave
      card.classList.remove('is-tilting');
      card.style.transform = '';
      card.style.setProperty('--mouse-x', '50%');
      card.style.setProperty('--mouse-y', '50%');
    });
  }
}

// Exportar globalmente
window.MangaReader = { Favorites, ReadingHistory, showToast };
console.log('MangaReader initialized.');
