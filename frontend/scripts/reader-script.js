document.addEventListener('DOMContentLoaded', function() {
    const isPremium = localStorage.getItem('premiumUser') === 'true';
    if (isPremium) {
        document.body.classList.add('premium-user');
        hidePremiumBanner();
    }

    const closeBannerBtn = document.querySelector('.btn-close-banner');
    if (closeBannerBtn) {
        closeBannerBtn.addEventListener('click', function() {
            const banner = document.querySelector('.premium-upgrade-banner');
            if (banner) {
                banner.style.opacity = '0';
                banner.style.transition = 'opacity 0.3s ease';
                setTimeout(() => banner.remove(), 300);
            }
        });
    }

    const pages = document.querySelectorAll('.page-container');
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.reading-progress p');
    let currentPage = 0;

    window.addEventListener('scroll', function() {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = (window.scrollY / totalHeight) * 100;
        if (progressBar) progressBar.style.width = Math.min(progress, 100) + '%';
        updateCurrentPage();
    });

    function updateCurrentPage() {
        const scrollPosition = window.scrollY + window.innerHeight / 2;
        pages.forEach((page, index) => {
            const pageTop = page.offsetTop;
            const pageBottom = pageTop + page.offsetHeight;
            if (scrollPosition >= pageTop && scrollPosition < pageBottom) {
                currentPage = index + 1;
                if (progressText) {
                    const pct = Math.round((currentPage / pages.length) * 100);
                    progressText.textContent = `Você leu ${pct}% deste capítulo`;
                }
            }
        });
    }

    const prevChapterBtn = document.querySelector('.btn-chapter-nav:first-child');
    const nextChapterBtn = document.querySelector('.btn-chapter-nav:last-child');

    if (prevChapterBtn) {
        prevChapterBtn.addEventListener('click', function(e) {
            if (!this.href || this.href.endsWith('#')) {
                e.preventDefault();
                showToast('Este é o primeiro capítulo disponível.');
            }
        });
    }

    if (nextChapterBtn) {
        nextChapterBtn.addEventListener('click', function(e) {
            if (!this.href || this.href.endsWith('#')) {
                e.preventDefault();
                showToast('Não há próximo capítulo disponível ainda.');
            }
        });
    }

    const footerPrevBtn = document.querySelector('.btn-footer-nav:first-child');
    const footerNextBtn = document.querySelector('.btn-footer-nav:last-child');

    if (footerPrevBtn) {
        footerPrevBtn.addEventListener('click', function(e) {
            if (!this.href || this.href.endsWith('#')) {
                e.preventDefault();
                showToast('Este é o primeiro capítulo disponível.');
            }
        });
    }

    if (footerNextBtn) {
        footerNextBtn.addEventListener('click', function(e) {
            if (!this.href || this.href.endsWith('#')) {
                e.preventDefault();
                showToast('Não há próximo capítulo disponível ainda.');
            }
        });
    }

    const fullscreenBtn = document.querySelector('.btn-option[title="Fullscreen"]');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }

    function toggleFullscreen() {
        const readingArea = document.querySelector('.reading-area');
        if (!document.fullscreenElement) {
            (readingArea.requestFullscreen || readingArea.webkitRequestFullscreen || readingArea.msRequestFullscreen || (() => {})).call(readingArea);
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
                fullscreenBtn.title = 'Sair do Fullscreen';
            }
        } else {
            (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen || (() => {})).call(document);
            if (fullscreenBtn) {
                fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
                fullscreenBtn.title = 'Fullscreen';
            }
        }
    }

    document.addEventListener('fullscreenchange', function() {
        if (!document.fullscreenElement && fullscreenBtn) {
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            fullscreenBtn.title = 'Fullscreen';
        }
    });

    const readingModeBtn = document.querySelector('.btn-option[title="Modo de Leitura"]');
    let isLongStrip = true;

    if (readingModeBtn) {
        readingModeBtn.addEventListener('click', function() {
            isLongStrip = !isLongStrip;
            const mangaPages = document.querySelector('.manga-pages');
            if (isLongStrip) {
                mangaPages.style.flexDirection = 'column';
                readingModeBtn.innerHTML = '<i class="fas fa-book"></i>';
                readingModeBtn.title = 'Modo de Leitura';
            } else {
                mangaPages.style.flexDirection = 'row';
                mangaPages.style.flexWrap = 'wrap';
                readingModeBtn.innerHTML = '<i class="fas fa-bars"></i>';
                readingModeBtn.title = 'Modo Tira Longa';
            }
        });
    }

    const settingsBtn = document.querySelector('.btn-option[title="Configurações"]');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', showSettingsModal);
    }

    function showSettingsModal() {
        if (document.querySelector('.settings-modal')) return;
        const modal = document.createElement('div');
        modal.className = 'settings-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Configurações de Leitura</h3>
                    <button class="modal-close" aria-label="Fechar">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="setting-item">
                        <label for="brightness-slider">Brilho</label>
                        <input id="brightness-slider" type="range" min="50" max="100" value="100" class="brightness-slider">
                    </div>
                    <div class="setting-item">
                        <label for="page-size-select">Tamanho</label>
                        <select id="page-size-select" class="page-size-select">
                            <option value="100">100%</option>
                            <option value="90">90%</option>
                            <option value="80">80%</option>
                            <option value="70">70%</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="night-mode">Modo Noturno</label>
                        <input id="night-mode" type="checkbox" checked>
                    </div>
                </div>
            </div>
        `;
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:200;';
        document.body.style.overflow = 'hidden';
        document.body.appendChild(modal);

        const closeModal = () => {
            modal.remove();
            document.body.style.overflow = '';
        };

        modal.querySelector('.modal-close').addEventListener('click', closeModal);
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

        modal.querySelector('.brightness-slider').addEventListener('input', function() {
            document.querySelector('.manga-pages').style.filter = `brightness(${this.value}%)`;
        });

        modal.querySelector('.page-size-select').addEventListener('change', function() {
            document.querySelector('.manga-pages').style.maxWidth = this.value === '100' ? '' : this.value + '%';
        });
    }

    document.addEventListener('keydown', function(e) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
        switch(e.key) {
            case 'ArrowLeft':
                if (prevChapterBtn && !prevChapterBtn.href.endsWith('#')) window.location.href = prevChapterBtn.href;
                break;
            case 'ArrowRight':
                if (nextChapterBtn && !nextChapterBtn.href.endsWith('#')) window.location.href = nextChapterBtn.href;
                break;
            case 'f': case 'F': toggleFullscreen(); break;
            case 'Escape':
                if (document.fullscreenElement) document.exitFullscreen();
                break;
        }
    });

    function saveReadingProgress() {
        const mangaId = document.querySelector('[data-manga-id]')?.dataset.mangaId || 'current';
        localStorage.setItem('readingProgress', JSON.stringify({ mangaId, currentPage, timestamp: Date.now() }));
    }

    setInterval(saveReadingProgress, 30000);
    window.addEventListener('beforeunload', saveReadingProgress);

    const saved = localStorage.getItem('readingProgress');
    if (saved) {
        try { JSON.parse(saved); } catch(e) { localStorage.removeItem('readingProgress'); }
    }
});

function hidePremiumBanner() {
    const banner = document.querySelector('.premium-upgrade-banner');
    if (banner) banner.remove();
}

function showToast(message, duration) {
    if (window.MangaReader && window.MangaReader.showToast) {
        window.MangaReader.showToast(message, duration);
        return;
    }
    duration = duration || 3000;
    const existing = document.querySelector('.mr-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'mr-toast';
    toast.textContent = message;
    toast.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--surface,#1a1b2e);border:1px solid var(--border,#2a2b3d);color:var(--text,#fff);padding:12px 24px;border-radius:8px;font-size:0.93rem;z-index:99999;opacity:0;transition:all 0.3s ease;box-shadow:0 8px 24px rgba(0,0,0,0.5);';
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}
