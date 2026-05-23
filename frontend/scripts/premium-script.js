document.addEventListener('DOMContentLoaded', function() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.querySelector('.faq-question').addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            faqItems.forEach(o => o.classList.remove('active'));
            if (!isActive) item.classList.add('active');
        });
    });

    const premiumButtons = document.querySelectorAll('.btn-plan.premium, .btn-cta');
    premiumButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const planType = this.classList.contains('btn-cta') ? 'Mensal' :
                this.textContent.includes('Anual') ? 'Anual' : 'Mensal';
            trackConversion(planType);
            showCheckoutModal(planType);
        });
    });

    const pricingCards = document.querySelectorAll('.pricing-card');
    const priceObserver = new IntersectionObserver(function(entries) {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 150);
            }
        });
    }, { threshold: 0.1 });

    pricingCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        priceObserver.observe(card);
    });
});

function showCheckoutModal(planType) {
    const modal = document.createElement('div');
    modal.className = 'checkout-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <button class="modal-close">&times;</button>
            <h2>Escolha sua forma de pagamento</h2>
            <p class="plan-info">Plano ${planType}</p>
            <div class="payment-options">
                <div class="payment-option" data-method="card">
                    <i class="fas fa-credit-card"></i>
                    <span>Cartão de Crédito</span>
                </div>
                <div class="payment-option" data-method="pix">
                    <i class="fas fa-qrcode"></i>
                    <span>PIX</span>
                </div>
                <div class="payment-option" data-method="boleto">
                    <i class="fas fa-barcode"></i>
                    <span>Boleto</span>
                </div>
                <div class="payment-option" data-method="paypal">
                    <i class="fab fa-paypal"></i>
                    <span>PayPal</span>
                </div>
            </div>
            <div class="secure-badge">
                <i class="fas fa-lock"></i>
                <span>Pagamento 100% seguro</span>
            </div>
        </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
        .checkout-modal{position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;display:flex;align-items:center;justify-content:center;}
        .modal-overlay{position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);}
        .modal-content{position:relative;background:var(--surface,#1a1b2e);padding:40px;border-radius:20px;max-width:500px;width:90%;text-align:center;border:2px solid var(--gold,#f5c518);}
        .modal-close{position:absolute;top:15px;right:20px;background:transparent;border:none;color:var(--muted,#888);font-size:2rem;cursor:pointer;transition:color 0.2s;}
        .modal-close:hover{color:var(--text,#fff);}
        .modal-content h2{margin-bottom:10px;color:var(--text,#fff);}
        .plan-info{color:var(--crimson,#e63946);font-weight:600;margin-bottom:30px;}
        .payment-options{display:grid;grid-template-columns:repeat(2,1fr);gap:15px;margin-bottom:30px;}
        .payment-option{background:rgba(255,255,255,0.05);padding:20px;border-radius:10px;cursor:pointer;transition:all 0.2s;border:2px solid transparent;}
        .payment-option:hover{border-color:var(--crimson,#e63946);background:rgba(230,57,70,0.1);}
        .payment-option i{font-size:2rem;color:var(--crimson,#e63946);margin-bottom:10px;display:block;}
        .payment-option span{color:var(--muted,#888);font-weight:600;}
        .payment-option.selected{border-color:var(--crimson,#e63946);background:rgba(230,57,70,0.15);}
        .secure-badge{display:flex;align-items:center;justify-content:center;gap:10px;color:#2ec4b6;font-size:0.9rem;}
        .secure-badge i{font-size:1.2rem;}
        .btn-confirm-payment{display:block;width:100%;margin-top:20px;padding:14px;background:var(--gold,#f5c518);color:#08090f;border:none;border-radius:10px;font-size:1rem;font-weight:800;cursor:pointer;transition:all 0.2s;}
        .btn-confirm-payment:hover{background:#e2b800;transform:translateY(-1px);}
        .btn-confirm-payment:disabled{opacity:0.5;cursor:not-allowed;transform:none;}
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    closeBtn.addEventListener('click', () => closeModal(modal, style));
    overlay.addEventListener('click', () => closeModal(modal, style));

    let selectedMethod = null;
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn-confirm-payment';
    confirmBtn.textContent = 'Confirmar Pagamento';
    confirmBtn.disabled = true;
    modal.querySelector('.modal-content').appendChild(confirmBtn);

    modal.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', function() {
            modal.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            selectedMethod = this.dataset.method;
            confirmBtn.disabled = false;
        });
    });

    confirmBtn.addEventListener('click', function() {
        if (!selectedMethod) return;
        this.textContent = 'Aguarde...';
        this.disabled = true;
        setTimeout(() => closeModal(modal, style), 1200);
    });
}

function closeModal(modal, style) {
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s ease';
    setTimeout(() => {
        modal.remove();
        if (style) style.remove();
    }, 300);
}

function trackConversion(planType) {
    let conversions = JSON.parse(localStorage.getItem('premium_conversions') || '[]');
    conversions.push({ plan: planType, timestamp: new Date().toISOString(), source: document.referrer || 'direct' });
    localStorage.setItem('premium_conversions', JSON.stringify(conversions));
}

const ABTest = {
    variants: { pricing: ['default', 'highlighted', 'minimal'] },
    getVariant: function(testName) {
        const saved = localStorage.getItem(`abtest_${testName}`);
        if (saved) return saved;
        const variants = this.variants[testName];
        const random = variants[Math.floor(Math.random() * variants.length)];
        localStorage.setItem(`abtest_${testName}`, random);
        return random;
    }
};
