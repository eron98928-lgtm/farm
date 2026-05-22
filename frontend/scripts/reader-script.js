// Reader Page JavaScript

document.addEventListener('DOMContentLoaded', async function () {
  await initReader();
});

async function initReader() {
  // Parâmetros da URL: ?manga=slug&chapter=1
  const params = new URLSearchParams(window.location.search);
  const mangaSlug = params.get('manga');
  const chapterNumber = params.get('chapter') || '1';

  // Status premium vem do token/session
  const isPremium = API.Auth.isPremium();
  applyPremiumState(isPremium);

  if (mangaSlug) {
    await loadChapter(mangaSlug, chapterNumber, isPremium);
  }

  initProgressTracker();
  initNavigation();
  initFullscreen();
  initReadingMode();
  initSettings();
  initKeyboard();
}

// ─── Carrega capítulo da API ──────────────────────────────────────────────────

async function loadChapter(mangaSlug, chapterNumber, isPremium) {
  try {
    const manga = await API.Manga.bySlug(mangaSlug);
    if (!manga) return;

    // Encontra o capítulo atual
    const chapter = manga.chapters?.find(c => c.chapterNumber === chapterNumber);
    if (!chapter) return;

    // Capítulo premium bloqueado para usuários free
    if (chapter.isPremium && !isPremium) {
      showPremiumGate();
      return;
    }

    // Renderiza páginas do capítulo
    const pagesContainer = document.querySelector('.manga-pages');
    if (pagesContainer && Array.isArray(chapter.pages) && chapter.pages.length > 0) {
      pagesContainer.innerHTML = chapter.pages.map((url, i) => `
        <div class="page-container" data-page="${i + 1}" style="--page-bg-image: url('${url}')">
          <img src="${url}" alt="Página ${i + 1}" loading="lazy"
               onerror="this.src='https://via.placeholder.com/800x1200/1a1a2e/ffffff?text=Página+${i + 1}'">
        </div>
      `).join('');
    }

    // Atualiza título do capítulo no header
    const titleEl = document.querySelector('.chapter-title');
    if (titleEl) titleEl.textContent = `${manga.title} — Cap. ${chapterNumber}`;

    // Salva no histórico
    await MangaReader.ReadingHistory.add(manga.id, chapter.id, 0);

    // Configura navegação entre capítulos
    setupChapterNavigation(manga.chapters, chapterNumber, mangaSlug);
  } catch {
    // mantém conteúdo estático do HTML se a API falhar
  }
}

// ─── Configura navegação de capítulos ────────────────────────────────────────

function setupChapterNavigation(chapters, currentNumber, mangaSlug) {
  if (!chapters || chapters.length === 0) return;

  const sorted = [...chapters].sort((a, b) => parseFloat(a.chapterNumber) - parseFloat(b.chapterNumber));
  const idx = sorted.findIndex(c => c.chapterNumber === currentNumber);

  const prevChapter = idx > 0 ? sorted[idx - 1] : null;
  const nextChapter = idx < sorted.length - 1 ? sorted[idx + 1] : null;

  const buildURL = (c) => `reader.html?manga=${mangaSlug}&chapter=${c.chapterNumber}`;

  document.querySelectorAll('.btn-chapter-nav:first-child, .btn-footer-nav:first-child').forEach(btn => {
    if (prevChapter) btn.href = buildURL(prevChapter);
  });

  document.querySelectorAll('.btn-chapter-nav:last-child, .btn-footer-nav:last-child').forEach(btn => {
    if (nextChapter) btn.href = buildURL(nextChapter);
  });
}

// ─── Estado premium ───────────────────────────────────────────────────────────

function applyPremiumState(isPremium) {
  const adLeft = document.querySelector('.ad-left');
  const adRight = document.querySelector('.ad-right');
  const banner = document.querySelector('.premium-upgrade-banner');

  if (isPremium) {
    document.body.classList.add('premium-user');
    adLeft?.remove();
    adRight?.remove();
    banner?.remove();
  } else {
    document.body.classList.remove('premium-user');
    banner?.classList.remove('hidden');
  }

  const closeBannerBtn = document.querySelector('.btn-close-banner');
  closeBannerBtn?.addEventListener('click', () => {
    banner?.remove();
  });
}

function showPremiumGate() {
  const pagesContainer = document.querySelector('.manga-pages');
  if (!pagesContainer) return;

  pagesContainer.innerHTML = `
    <div style="text-align:center; padding: 60px 20px; color: #fff;">
      <i class="fas fa-lock" style="font-size: 4rem; color: #f5c518; margin-bottom: 20px; display:block;"></i>
      <h2>Capítulo Exclusivo Premium</h2>
      <p style="color: #aaa; margin: 16px 0 28px;">Assine o Premium para ler sem anúncios e acessar todos os capítulos.</p>
      <a href="premium.html" style="background:#f5c518; color:#000; padding:14px 32px; border-radius:8px; font-weight:700; text-decoration:none;">
        Assinar Agora
      </a>
    </div>
  `;
}

// ─── Progress tracker ─────────────────────────────────────────────────────────

function initProgressTracker() {
  const pages = document.querySelectorAll('.page-container');
  const progressBar = document.querySelector('.progress-fill');
  const progressText = document.querySelector('.reading-progress p');
  let autoSaveTimer = null;

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;

    if (progressBar) progressBar.style.width = `${Math.min(progress, 100)}%`;

    let currentPage = 0;
    const midpoint = window.scrollY + window.innerHeight / 2;
    pages.forEach((page, i) => {
      if (midpoint >= page.offsetTop && midpoint < page.offsetTop + page.offsetHeight) {
        currentPage = i + 1;
      }
    });

    if (progressText && currentPage > 0) {
      const pct = Math.round((currentPage / pages.length) * 100);
      progressText.textContent = `Você leu ${pct}% deste capítulo`;
    }

    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => saveProgress(currentPage), 2000);
  });
}

function saveProgress(page) {
  const params = new URLSearchParams(window.location.search);
  const key = `progress_${params.get('manga')}_${params.get('chapter')}`;
  localStorage.setItem(key, String(page));
}

// ─── Navegação entre capítulos ────────────────────────────────────────────────

function initNavigation() {
  document.querySelectorAll('.btn-chapter-nav, .btn-footer-nav').forEach(btn => {
    btn.addEventListener('click', function (e) {
      if (!this.href || this.href.endsWith('#')) {
        e.preventDefault();
        MangaReader.showToast('Não há mais capítulos disponíveis.', 'info');
      }
    });
  });
}

// ─── Fullscreen ───────────────────────────────────────────────────────────────

function initFullscreen() {
  const btn = document.querySelector('.btn-option[title="Fullscreen"]');
  if (!btn) return;

  btn.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', () => {
    btn.innerHTML = document.fullscreenElement
      ? '<i class="fas fa-compress"></i>'
      : '<i class="fas fa-expand"></i>';
  });
}

function toggleFullscreen() {
  const area = document.querySelector('.reading-area');
  if (!document.fullscreenElement) {
    area?.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// ─── Modo de leitura ──────────────────────────────────────────────────────────

function initReadingMode() {
  const btn = document.querySelector('.btn-option[title="Modo de Leitura"]');
  if (!btn) return;

  let longStrip = true;
  btn.addEventListener('click', () => {
    longStrip = !longStrip;
    const pages = document.querySelector('.manga-pages');
    if (!pages) return;
    pages.style.flexDirection = longStrip ? 'column' : 'row';
    pages.style.flexWrap = longStrip ? '' : 'wrap';
    btn.innerHTML = longStrip ? '<i class="fas fa-book"></i>' : '<i class="fas fa-bars"></i>';
  });
}

// ─── Modal de configurações ───────────────────────────────────────────────────

function initSettings() {
  const btn = document.querySelector('.btn-option[title="Configurações"]');
  btn?.addEventListener('click', showSettingsModal);
}

function showSettingsModal() {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:10000;';
  modal.innerHTML = `
    <div style="background:#1a1a2e;padding:36px;border-radius:12px;width:360px;max-width:90%;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;">
        <h3 style="color:#fff;margin:0;">Configurações</h3>
        <button id="close-settings" style="background:none;border:none;color:#aaa;font-size:1.5rem;cursor:pointer;">&times;</button>
      </div>
      <label style="color:#ccc;display:block;margin-bottom:8px;">Brilho</label>
      <input type="range" min="50" max="100" value="100" id="brightness-slider" style="width:100%;margin-bottom:20px;">
      <label style="color:#ccc;display:block;margin-bottom:8px;">Tamanho das páginas</label>
      <select id="page-size" style="width:100%;padding:8px;background:#333;color:#fff;border:none;border-radius:6px;">
        <option value="100">100%</option>
        <option value="90">90%</option>
        <option value="80">80%</option>
        <option value="70">70%</option>
      </select>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#close-settings').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => e.target === modal && modal.remove());

  modal.querySelector('#brightness-slider').addEventListener('input', function () {
    document.querySelector('.manga-pages').style.filter = `brightness(${this.value}%)`;
  });

  modal.querySelector('#page-size').addEventListener('change', function () {
    document.querySelectorAll('.page-container img').forEach(img => {
      img.style.maxWidth = `${this.value}%`;
    });
  });
}

// ─── Atalhos de teclado ───────────────────────────────────────────────────────

function initKeyboard() {
  document.addEventListener('keydown', e => {
    switch (e.key) {
      case 'f': case 'F': toggleFullscreen(); break;
      case 'Escape': document.fullscreenElement && document.exitFullscreen(); break;
    }
  });
}

console.log('Reader initialized.');
