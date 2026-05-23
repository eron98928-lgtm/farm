// Script específico para a página Premium

document.addEventListener('DOMContentLoaded', function() {
    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            const isActive = item.classList.contains('active');
            
            // Fecha todos os outros itens
            faqItems.forEach(otherItem => {
                otherItem.classList.remove('active');
            });
            
            // Abre/fecha o item atual
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // Botões de assinatura
    const premiumButtons = document.querySelectorAll('.btn-plan.premium, .btn-cta');
    
    premiumButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Em produção, isso abriria o checkout
            const planType = this.classList.contains('btn-cta') ? 'Mensal' : 
                           this.textContent.includes('Anual') ? 'Anual' : 'Mensal';
            
            showCheckoutModal(planType);
        });
    });

    // Animação dos cards de preço ao scroll
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

    // Counter animation para preços
    animateCounter();
});

// Modal de Checkout
function showCheckoutModal(planType) {
    // Criar modal dinamicamente
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

    // Adicionar estilos do modal
    const style = document.createElement('style');
    style.textContent = `
        .checkout-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
        }
        
        .modal-content {
            position: relative;
            background: var(--card-bg);
            padding: 40px;
            border-radius: 20px;
            max-width: 500px;
            width: 90%;
            text-align: center;
            border: 2px solid var(--gold);
        }
        
        .modal-close {
            position: absolute;
            top: 15px;
            right: 20px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            font-size: 2rem;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .modal-close:hover {
            color: var(--text-primary);
        }
        
        .modal-content h2 {
            margin-bottom: 10px;
            color: var(--text-primary);
        }
        
        .plan-info {
            color: var(--primary-color);
            font-weight: 600;
            margin-bottom: 30px;
        }
        
        .payment-options {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .payment-option {
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }
        
        .payment-option:hover {
            border-color: var(--primary-color);
            background: rgba(102, 126, 234, 0.1);
        }
        
        .payment-option i {
            font-size: 2rem;
            color: var(--primary-color);
            margin-bottom: 10px;
            display: block;
        }
        
        .payment-option span {
            color: var(--text-secondary);
            font-weight: 600;
        }
        
        .secure-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            color: #4ecdc4;
            font-size: 0.9rem;
        }
        
        .secure-badge i {
            font-size: 1.2rem;
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    // Fechar modal
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    closeBtn.addEventListener('click', () => {
        closeModal(modal, style);
    });
    
    overlay.addEventListener('click', () => {
        closeModal(modal, style);
    });

    // Selecionar forma de pagamento
    const paymentOptions = modal.querySelectorAll('.payment-option');
    paymentOptions.forEach(option => {
        option.addEventListener('click', function() {
            const method = this.dataset.method;
            alert(`Redirecionando para pagamento via ${method}...`);
            // Em produção, redirecionaria para o gateway de pagamento
        });
    });
}

function closeModal(modal, style) {
    modal.style.opacity = '0';
    modal.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        modal.remove();
        style.remove();
    }, 300);
}

// Animação de contador
function animateCounter() {
    const counters = document.querySelectorAll('.price');
    
    counters.forEach(counter => {
        const text = counter.textContent;
        // Aqui você pode implementar animação de números se necessário
    });
}

// Tracking de conversão
function trackConversion(planType) {
    // Em produção, integraria com Google Analytics, Facebook Pixel, etc.
    console.log(`Conversão: Plano ${planType} selecionado`);
    
    // Salvar no localStorage para análise
    let conversions = JSON.parse(localStorage.getItem('premium_conversions') || '[]');
    conversions.push({
        plan: planType,
        timestamp: new Date().toISOString(),
        source: document.referrer || 'direct'
    });
    localStorage.setItem('premium_conversions', JSON.stringify(conversions));
}

// Sistema de teste A/B (opcional)
const ABTest = {
    variants: {
        pricing: ['default', 'highlighted', 'minimal']
    },
    
    getVariant: function(testName) {
        const saved = localStorage.getItem(`abtest_${testName}`);
        if (saved) return saved;
        
        const variants = this.variants[testName];
        const random = variants[Math.floor(Math.random() * variants.length)];
        localStorage.setItem(`abtest_${testName}`, random);
        return random;
    }
};

console.log('Premium page initialized!');
