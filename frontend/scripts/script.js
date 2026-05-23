document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');

    if (searchButton && searchInput) {
        const doSearch = () => {
            const query = searchInput.value.trim();
            if (query) {
                window.location.href = `/?q=${encodeURIComponent(query)}`;
            }
        };
        searchButton.addEventListener('click', doSearch);
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') doSearch();
        });
    }

    const mangaCards = document.querySelectorAll('.manga-card, .manga-list-item');
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    mangaCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const input = this.querySelector('input[type="email"]');
            const emailVal = (input.value || '').trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailVal)) {
                showToast('Digite um e-mail válido.');
                input.focus();
                return;
            }
            const btn = this.querySelector('button');
            if (btn) { btn.disabled = true; btn.textContent = '✓'; }
            showToast('Inscrição realizada! Verifique seu e-mail.');
            setTimeout(() => {
                this.reset();
                if (btn) { btn.disabled = false; btn.textContent = 'Inscrever'; }
            }, 2000);
        });
    }

    createMobileMenu();
});

function createMobileMenu() {
    const nav = document.querySelector('.nav');
    if (window.innerWidth <= 768 && nav) {
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.style.cssText = 'background:transparent;border:none;color:white;font-size:1.5rem;cursor:pointer;display:block;';
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }
}

function showToast(message, duration) {
    duration = duration || 3000;
    const existing = document.querySelector('.mr-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'mr-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position:fixed;bottom:30px;left:50%;transform:translateX(-50%) translateY(20px);
        background:var(--surface,#1a1b2e);border:1px solid var(--border,#2a2b3d);
        color:var(--text,#fff);padding:12px 24px;border-radius:8px;font-size:0.93rem;
        z-index:99999;opacity:0;transition:all 0.3s ease;white-space:nowrap;
        box-shadow:0 8px 24px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

const Favorites = {
    add: function(mangaId, mangaData) {
        let favorites = this.getAll();
        if (!favorites.find(f => f.id === mangaId)) {
            favorites.push({ id: mangaId, ...mangaData, date: new Date().toISOString() });
            localStorage.setItem('mangaFavorites', JSON.stringify(favorites));
            return true;
        }
        return false;
    },
    remove: function(mangaId) {
        let favorites = this.getAll().filter(f => f.id !== mangaId);
        localStorage.setItem('mangaFavorites', JSON.stringify(favorites));
    },
    getAll: function() {
        return JSON.parse(localStorage.getItem('mangaFavorites') || '[]');
    },
    isFavorite: function(mangaId) {
        return this.getAll().some(f => f.id === mangaId);
    }
};

const ReadingHistory = {
    add: function(mangaId, chapterNumber, mangaData) {
        let history = this.getAll();
        const existingIndex = history.findIndex(h => h.id === mangaId);
        const entry = { id: mangaId, chapter: chapterNumber, lastRead: new Date().toISOString(), ...mangaData };
        if (existingIndex >= 0) {
            history[existingIndex] = entry;
        } else {
            history.unshift(entry);
        }
        localStorage.setItem('readingHistory', JSON.stringify(history.slice(0, 50)));
    },
    getAll: function() {
        return JSON.parse(localStorage.getItem('readingHistory') || '[]');
    }
};

const ThemeManager = {
    setTheme: function(theme) {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    },
    getTheme: function() {
        return localStorage.getItem('theme') || 'dark';
    },
    toggleTheme: function() {
        this.setTheme(this.getTheme() === 'dark' ? 'light' : 'dark');
    }
};

const Analytics = {
    trackPageView: function(pageName) {
        let views = JSON.parse(localStorage.getItem('analytics_views') || '[]');
        views.push({ page: pageName, timestamp: new Date().toISOString() });
        localStorage.setItem('analytics_views', JSON.stringify(views.slice(-200)));
    },
    trackMangaRead: function(mangaId, chapterNumber) {
        let reads = JSON.parse(localStorage.getItem('analytics_reads') || '[]');
        reads.push({ mangaId, chapter: chapterNumber, timestamp: new Date().toISOString() });
        localStorage.setItem('analytics_reads', JSON.stringify(reads.slice(-100)));
    }
};

const ErrorTracker = {
    _queue: [],
    capture: function(type, msg, src, line) {
        const entry = { type, msg, src, line, url: location.href, ts: new Date().toISOString() };
        this._queue.push(entry);
        try {
            const stored = JSON.parse(localStorage.getItem('_mr_errors') || '[]');
            stored.push(entry);
            localStorage.setItem('_mr_errors', JSON.stringify(stored.slice(-50)));
        } catch(e) {}
    }
};

window.addEventListener('error', function(e) {
    ErrorTracker.capture('error', e.message, e.filename, e.lineno);
});
window.addEventListener('unhandledrejection', function(e) {
    ErrorTracker.capture('promise', String(e.reason), '', 0);
});

document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible' && document.body.style.overflow === 'hidden') {
        const hasOpenModal = document.querySelector('[style*="position:fixed"][style*="z-index"], .settings-modal, .checkout-modal');
        if (!hasOpenModal) document.body.style.overflow = '';
    }
});

window.MangaReader = { Favorites, ReadingHistory, ThemeManager, Analytics, ErrorTracker, showToast };

(function initImageFallbacks() {
    const palettes = [
        ['#e63946', '#c1121f'],
        ['#7c3aed', '#5b21b6'],
        ['#2ec4b6', '#0a9396'],
        ['#f5c518', '#b5942b'],
        ['#e63946', '#7c3aed'],
    ];

    function makeSVG(alt, w, h, colors) {
        const label = (alt || 'MR').substring(0, 2).toUpperCase();
        const fs = Math.round(Math.min(w, h) * 0.22);
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
            <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${colors[0]}"/>
                <stop offset="100%" stop-color="${colors[1]}"/>
            </linearGradient></defs>
            <rect width="${w}" height="${h}" fill="url(#g)"/>
            <rect x="10%" y="10%" width="80%" height="80%" rx="8" fill="rgba(0,0,0,0.25)"/>
            <text x="50%" y="48%" text-anchor="middle" dominant-baseline="middle"
                fill="rgba(255,255,255,0.9)" font-size="${fs}" font-weight="bold"
                font-family="sans-serif">${label}</text>
            <text x="50%" y="72%" text-anchor="middle" dominant-baseline="middle"
                fill="rgba(255,255,255,0.55)" font-size="${Math.round(fs*0.28)}"
                font-family="sans-serif">${(alt||'').substring(0,18)}</text>
        </svg>`;
        return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    }

    let idx = 0;
    document.querySelectorAll('img').forEach(img => {
        const palette = palettes[idx++ % palettes.length];
        const handler = function() {
            const w = this.naturalWidth || this.width || 300;
            const h = this.naturalHeight || this.height || 450;
            this.src = makeSVG(this.alt, w || 300, h || 450, palette);
            this.onerror = null;
        };
        img.onerror = handler;
        if (img.complete && img.naturalWidth === 0) handler.call(img);
    });
})();
