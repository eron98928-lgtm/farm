// Script da página Premium

document.addEventListener('DOMContentLoaded', function () {
  initFAQ();
  initPricingButtons();
  initAnimations();

  // Mostra estado atual se já for premium
  if (API.Auth.isPremium()) {
    showAlreadyPremiumBanner();
  }
});

// ─── FAQ Accordion ────────────────────────────────────────────────────────────

function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question')?.addEventListener('click', function () {
      const isActive = item.classList.contains('active');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });
}

// ─── Botões de assinatura ─────────────────────────────────────────────────────

function initPricingButtons() {
  document.querySelectorAll('.btn-plan.premium, .btn-cta').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const planType = this.textContent?.toLowerCase().includes('anual') ? 'anual' : 'mensal';
      showCheckoutModal(planType);
    });
  });
}

// ─── Animação de entrada dos cards ────────────────────────────────────────────

function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, i * 150);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.pricing-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
  });
}

// ─── Banner para quem já é premium ───────────────────────────────────────────

function showAlreadyPremiumBanner() {
  const hero = document.querySelector('.premium-hero, .hero, section');
  if (!hero) return;

  const banner = document.createElement('div');
  banner.style.cssText = 'background:#43e97b22;border:1px solid #43e97b;color:#43e97b;padding:16px 24px;border-radius:8px;margin:20px auto;max-width:700px;text-align:center;font-weight:600;';
  banner.innerHTML = '<i class="fas fa-check-circle"></i> Você já é Premium! Aproveite sua leitura sem anúncios.';
  hero.insertAdjacentElement('afterend', banner);
}

// ─── Modal de Checkout ────────────────────────────────────────────────────────

function showCheckoutModal(planType) {
  const prices = { mensal: 'R$ 14,90/mês', anual: 'R$ 99,90/ano' };

  const modal = document.createElement('div');
  modal.className = 'checkout-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;';

  modal.innerHTML = `
    <div class="modal-overlay" style="position:absolute;inset:0;background:rgba(0,0,0,0.8);"></div>
    <div style="position:relative;background:var(--card-bg,#1a1a2e);padding:40px;border-radius:20px;max-width:500px;width:90%;text-align:center;border:2px solid var(--gold,#f5c518);">
      <button id="close-checkout" style="position:absolute;top:15px;right:20px;background:none;border:none;color:#aaa;font-size:2rem;cursor:pointer;">&times;</button>
      <h2 style="color:#fff;margin-bottom:8px;">Plano ${planType.charAt(0).toUpperCase() + planType.slice(1)}</h2>
      <p style="color:var(--gold,#f5c518);font-size:1.4rem;font-weight:700;margin-bottom:28px;">${prices[planType]}</p>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:28px;">
        ${[
          { icon: 'fa-credit-card', label: 'Cartão de Crédito', method: 'card' },
          { icon: 'fa-qrcode', label: 'PIX', method: 'pix' },
          { icon: 'fa-barcode', label: 'Boleto', method: 'boleto' },
          { icon: 'fa-paypal fab', label: 'PayPal', method: 'paypal' },
        ].map(p => `
          <div class="payment-option" data-method="${p.method}"
               style="background:rgba(255,255,255,0.05);padding:20px;border-radius:10px;cursor:pointer;border:2px solid transparent;transition:all .2s;"
               onmouseover="this.style.borderColor='var(--primary-color,#667eea)'"
               onmouseout="this.style.borderColor='transparent'">
            <i class="fas ${p.icon}" style="font-size:2rem;color:var(--primary-color,#667eea);display:block;margin-bottom:8px;"></i>
            <span style="color:#ccc;font-weight:600;">${p.label}</span>
          </div>
        `).join('')}
      </div>
      <div style="color:#4ecdc4;font-size:.9rem;">
        <i class="fas fa-lock"></i> Pagamento 100% seguro e criptografado
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('#close-checkout').addEventListener('click', () => modal.remove());
  modal.querySelector('.modal-overlay').addEventListener('click', () => modal.remove());

  modal.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', function () {
      const method = this.dataset.method;
      handlePayment(planType, method, modal);
    });
  });
}

async function handlePayment(planType, method, modal) {
  modal.remove();

  // Aqui integraria com gateway de pagamento (Stripe, Mercado Pago, etc.)
  // Por enquanto simula a assinatura localmente
  MangaReader.showToast(`Redirecionando para pagamento via ${method}...`, 'info');

  setTimeout(() => {
    // Simulação: após pagamento confirmado, marca como premium
    API.Auth.setSession(localStorage.getItem('clerk_token') || 'demo', true);
    MangaReader.showToast('Parabéns! Você agora é Premium. Aproveite!', 'success');

    setTimeout(() => window.location.href = 'index.html', 2000);
  }, 1500);
}

console.log('Premium page initialized.');
