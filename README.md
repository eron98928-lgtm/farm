# MangaReader Platform

Plataforma de leitura de mangás com monetização integrada e conformidade legal (ECA Digital, LGPD).

## 📁 Estrutura do Projeto

```
/workspace
├── frontend/              # Front-end da aplicação
│   ├── pages/            # Páginas HTML
│   │   ├── index.html    # Página inicial
│   │   ├── premium.html  # Página de assinaturas
│   │   └── reader.html   # Página de leitura
│   ├── styles/           # Folhas de estilo CSS
│   │   ├── styles.css         # Estilos globais
│   │   ├── premium-styles.css # Estilos da página premium
│   │   └── reader-styles.css  # Estilos da página de leitura
│   ├── scripts/          # Scripts JavaScript
│   │   ├── script.js         # Funcionalidades globais
│   │   ├── premium-script.js # Lógica da página premium
│   │   └── reader-script.js  # Lógica da página de leitura
│   └── components/       # Componentes reutilizáveis (futuro)
│
├── backend/              # Back-end da aplicação (em desenvolvimento)
│   └── src/
│       ├── _core/        # Configurações centrais (segurança, rate limiting, etc.)
│       ├── routers/      # Rotas tRPC
│       ├── services/     # Serviços de negócio
│       └── jobs/         # Jobs agendados
│
├── docs/                 # Documentação
│   ├── guia-estrategico-manga.md      # Guia estratégico completo
│   └── REQUISITOS_DESENVOLVIMENTO.md  # Requisitos técnicos detalhados
│
├── config/               # Arquivos de configuração
│   └── instrucoes_para_ia.txt         # Instruções para IAs colaboradoras
│
├── .gitignore            # Arquivos ignorados pelo Git
└── README.md             # Este arquivo
```

## 🚀 Funcionalidades

### Para Usuários Free
- ✅ Leitura de mangás em qualidade HD
- ✅ Acesso a todo o catálogo
- ✅ Sistema de favoritos e histórico
- ⚠️ Anúncios discretos nas laterais da página de leitura

### Para Usuários Premium
- ✅ Todos os benefícios do plano Free
- ✅ **Sem anúncios**
- ✅ Downloads offline
- ✅ Acesso antecipado a capítulos
- ✅ Suporte prioritário

## 🛡️ Segurança e Conformidade

- **Verificação de CPF** (ECA Digital - Lei 15.211/2025)
- **Proteção de dados** (LGPD)
- **Rate limiting** contra ataques e bots
- **WAF** (Cloudflare)
- **Monitoramento** (Sentry, PostHog)
- **Auditoria contínua** (Snyk)

## 📋 Stack Tecnológico

### Front-end
- HTML5, CSS3, JavaScript (Vanilla)
- Font Awesome (ícones)

### Back-end (Em implementação)
- **Runtime:** Node.js + Express.js
- **API:** tRPC
- **Banco de Dados:** MySQL/TiDB (Supabase)
- **Autenticação:** Clerk + Manus OAuth
- **Cache:** Redis (Upstash)
- **Busca Vetorial:** Pinecone

### Serviços Integrados
- **Pagamentos:** Stripe, Hotmart
- **E-mail:** Resend
- **Analytics:** PostHog
- **Monitoramento:** Sentry
- **Segurança:** Cloudflare WAF, Snyk
- **Verificação de Identidade:** FonteData

## 🔧 Desenvolvimento

### Pré-requisitos
- Node.js 18+
- Git
- Conta no Supabase, Clerk, Stripe, etc.

### Instalação (Backend)
```bash
cd backend
npm install
cp .env.example .env
# Preencher .env com as chaves de API
npm run dev
```

### Visualizar Front-end
Abra `frontend/pages/index.html` no navegador ou use um servidor local:
```bash
npx serve frontend/pages
```

## 📄 Documentação Completa

- [Guia Estratégico](docs/guia-estrategico-manga.md) - Monetização, segurança e aspectos legais
- [Requisitos de Desenvolvimento](docs/REQUISITOS_DESENVOLVIMENTO.md) - Especificações técnicas detalhadas

## ⚖️ Aviso Legal

Este projeto opera com conteúdo licenciado ou de domínio público. A verificação de idade (+16) é obrigatória conforme ECA Digital. Consulte os termos de uso para mais informações.

---

**Versão:** 1.0  
**Última Atualização:** Maio de 2026
