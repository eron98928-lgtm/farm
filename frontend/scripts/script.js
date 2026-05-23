// Script principal do MangaReader

// Pesquisa de mangás
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-box input');
    const searchButton = document.querySelector('.search-box button');

    if (searchButton && searchInput) {
        searchButton.addEventListener('click', function() {
            const query = searchInput.value.trim();
            if (query) {
                alert(`Buscando por: ${query}`);
                // Aqui você implementaria a lógica de busca real
            }
        });

        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    alert(`Buscando por: ${query}`);
                }
            }
        });
    }

    // Animação dos cards de mangá
    const mangaCards = document.querySelectorAll('.manga-card, .manga-list-item');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    mangaCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Newsletter form
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            if (email) {
                alert(`Obrigado por se inscrever! Enviamos um email de confirmação para: ${email}`);
                this.reset();
            }
        });
    }

    // Botões de leitura
    const readButtons = document.querySelectorAll('.btn-read');
    readButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Em produção, isso levaria à página do leitor
            console.log('Indo para o leitor...');
        });
    });

    // Menu mobile (se necessário)
    createMobileMenu();
});

// Função para criar menu mobile
function createMobileMenu() {
    const nav = document.querySelector('.nav');
    const header = document.querySelector('.header .container');
    
    if (window.innerWidth <= 768) {
        const menuToggle = document.createElement('button');
        menuToggle.className = 'menu-toggle';
        menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
        menuToggle.style.cssText = `
            background: transparent;
            border: none;
            color: white;
            font-size: 1.5rem;
            cursor: pointer;
            display: block;
        `;
        
        // Adicionar funcionalidade de toggle
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
        });
    }
}

// Sistema de favoritos (localStorage)
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
        let favorites = this.getAll();
        favorites = favorites.filter(f => f.id !== mangaId);
        localStorage.setItem('mangaFavorites', JSON.stringify(favorites));
    },
    
    getAll: function() {
        return JSON.parse(localStorage.getItem('mangaFavorites') || '[]');
    },
    
    isFavorite: function(mangaId) {
        return this.getAll().some(f => f.id === mangaId);
    }
};

// Sistema de histórico de leitura
const ReadingHistory = {
    add: function(mangaId, chapterNumber, mangaData) {
        let history = this.getAll();
        const existingIndex = history.findIndex(h => h.id === mangaId);
        
        const entry = {
            id: mangaId,
            chapter: chapterNumber,
            lastRead: new Date().toISOString(),
            ...mangaData
        };
        
        if (existingIndex >= 0) {
            history[existingIndex] = entry;
        } else {
            history.unshift(entry);
        }
        
        // Manter apenas os últimos 50 itens
        history = history.slice(0, 50);
        localStorage.setItem('readingHistory', JSON.stringify(history));
    },
    
    getAll: function() {
        return JSON.parse(localStorage.getItem('readingHistory') || '[]');
    }
};

// Sistema de tema (claro/escuro)
const ThemeManager = {
    setTheme: function(theme) {
        localStorage.setItem('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    },
    
    getTheme: function() {
        return localStorage.getItem('theme') || 'dark';
    },
    
    toggleTheme: function() {
        const current = this.getTheme();
        const newTheme = current === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
};

// Analytics simples para rastrear leituras
const Analytics = {
    trackPageView: function(pageName) {
        console.log(`Page view: ${pageName}`);
        // Em produção, integraria com Google Analytics ou similar
    },
    
    trackMangaRead: function(mangaId, chapterNumber) {
        console.log(`Manga read: ${mangaId}, Chapter: ${chapterNumber}`);
        // Salvar no localStorage para sincronização futura
        let reads = JSON.parse(localStorage.getItem('analytics_reads') || '[]');
        reads.push({
            mangaId,
            chapter: chapterNumber,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('analytics_reads', JSON.stringify(reads.slice(-100)));
    }
};

// Exportar funções para uso global
window.MangaReader = {
    Favorites,
    ReadingHistory,
    ThemeManager,
    Analytics
};

console.log('MangaReader initialized successfully!');

// Fallback para imagens quebradas (via.placeholder.com offline etc)
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
            <defs>
                <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="${colors[0]}"/>
                    <stop offset="100%" stop-color="${colors[1]}"/>
                </linearGradient>
            </defs>
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
