// Reader Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is premium (simulated)
    const isPremium = localStorage.getItem('premiumUser') === 'true';
    
    if (isPremium) {
        document.body.classList.add('premium-user');
        hidePremiumBanner();
    }
    
    // Close premium banner
    const closeBannerBtn = document.querySelector('.btn-close-banner');
    if (closeBannerBtn) {
        closeBannerBtn.addEventListener('click', function() {
            const banner = document.querySelector('.premium-upgrade-banner');
            if (banner) {
                banner.style.display = 'none';
            }
        });
    }
    
    // Reading progress tracker
    const pages = document.querySelectorAll('.page-container');
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.reading-progress p');
    
    let currentPage = 0;
    
    // Track scroll position to update progress
    window.addEventListener('scroll', function() {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPosition = window.scrollY;
        const progress = (scrollPosition / totalHeight) * 100;
        
        if (progressBar) {
            progressBar.style.width = Math.min(progress, 100) + '%';
        }
        
        // Update current page based on scroll
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
                    const percentage = Math.round((currentPage / pages.length) * 100);
                    progressText.textContent = `Você leu ${percentage}% deste capítulo`;
                }
            }
        });
    }
    
    // Chapter navigation buttons
    const prevChapterBtn = document.querySelector('.btn-chapter-nav:first-child');
    const nextChapterBtn = document.querySelector('.btn-chapter-nav:last-child');
    
    if (prevChapterBtn) {
        prevChapterBtn.addEventListener('click', function(e) {
            if (!this.href || this.href === '#') {
                e.preventDefault();
                alert('Este é o primeiro capítulo disponível!');
            }
        });
    }
    
    if (nextChapterBtn) {
        nextChapterBtn.addEventListener('click', function(e) {
            if (!this.href || this.href === '#') {
                e.preventDefault();
                // In a real app, this would navigate to the next chapter
                console.log('Navigate to next chapter');
            }
        });
    }
    
    // Footer navigation
    const footerPrevBtn = document.querySelector('.btn-footer-nav:first-child');
    const footerNextBtn = document.querySelector('.btn-footer-nav:last-child');
    
    if (footerPrevBtn) {
        footerPrevBtn.addEventListener('click', function(e) {
            if (!this.href || this.href === '#') {
                e.preventDefault();
                alert('Este é o primeiro capítulo disponível!');
            }
        });
    }
    
    if (footerNextBtn) {
        footerNextBtn.addEventListener('click', function(e) {
            if (!this.href || this.href === '#') {
                e.preventDefault();
                console.log('Navigate to next chapter');
            }
        });
    }
    
    // Fullscreen toggle
    const fullscreenBtn = document.querySelector('.btn-option[title="Fullscreen"]');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
            toggleFullscreen();
        });
    }
    
    function toggleFullscreen() {
        const readingArea = document.querySelector('.reading-area');
        
        if (!document.fullscreenElement) {
            if (readingArea.requestFullscreen) {
                readingArea.requestFullscreen();
            } else if (readingArea.webkitRequestFullscreen) {
                readingArea.webkitRequestFullscreen();
            } else if (readingArea.msRequestFullscreen) {
                readingArea.msRequestFullscreen();
            }
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            fullscreenBtn.title = 'Sair do Fullscreen';
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            fullscreenBtn.title = 'Fullscreen';
        }
    }
    
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', function() {
        if (!document.fullscreenElement) {
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            fullscreenBtn.title = 'Fullscreen';
        }
    });
    
    // Reading mode toggle (single page / long strip)
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
    
    // Settings button (placeholder for future features)
    const settingsBtn = document.querySelector('.btn-option[title="Configurações"]');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', function() {
            showSettingsModal();
        });
    }
    
    function showSettingsModal() {
        // Create settings modal
        const modal = document.createElement('div');
        modal.className = 'settings-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Configurações de Leitura</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="setting-item">
                        <label>Brilho da Tela</label>
                        <input type="range" min="50" max="100" value="100" class="brightness-slider">
                    </div>
                    <div class="setting-item">
                        <label>Tamanho da Página</label>
                        <select class="page-size-select">
                            <option value="100">100%</option>
                            <option value="90">90%</option>
                            <option value="80">80%</option>
                            <option value="70">70%</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>Modo Noturno</label>
                        <input type="checkbox" id="night-mode" checked>
                    </div>
                </div>
            </div>
        `;
        
        // Add styles
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        document.body.appendChild(modal);
        
        // Close modal
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', function() {
            modal.remove();
        });
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'ArrowLeft':
                // Navigate to previous chapter
                if (prevChapterBtn && prevChapterBtn.href !== '#') {
                    window.location.href = prevChapterBtn.href;
                }
                break;
            case 'ArrowRight':
                // Navigate to next chapter
                if (nextChapterBtn && nextChapterBtn.href !== '#') {
                    window.location.href = nextChapterBtn.href;
                }
                break;
            case 'f':
            case 'F':
                toggleFullscreen();
                break;
            case 'Escape':
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
                break;
        }
    });
    
    // Save reading progress to localStorage
    function saveReadingProgress() {
        const mangaId = 'one-piece-1098'; // This would come from the URL or data attribute
        const progress = {
            mangaId: mangaId,
            currentPage: currentPage,
            timestamp: Date.now()
        };
        localStorage.setItem('readingProgress', JSON.stringify(progress));
    }
    
    // Auto-save progress every 30 seconds
    setInterval(saveReadingProgress, 30000);
    
    // Save on page unload
    window.addEventListener('beforeunload', saveReadingProgress);
    
    // Load saved progress
    function loadReadingProgress() {
        const saved = localStorage.getItem('readingProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            console.log('Previous progress loaded:', progress);
            // Could scroll to last read page
        }
    }
    
    loadReadingProgress();
    
    console.log('Reader initialized successfully!');
});
