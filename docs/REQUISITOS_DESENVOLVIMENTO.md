# Requisitos de Desenvolvimento - Plataforma de Leitura de Mangás

**Versão:** 1.0  
**Data:** Maio de 2026  
**Destinatário:** Desenvolvedor Qwen  
**Status:** Pronto para Implementação

---

## 1. Escopo e Contexto

Este documento define os requisitos técnicos e funcionais para a continuidade do desenvolvimento da plataforma de leitura de mangás. O **front-end já está desenvolvido e entregue** — a implementação deve focar exclusivamente no backend, segurança, analytics e funcionalidades de engajamento. As assinaturas premium já estão resolvidas e **não devem ser alteradas sob nenhuma circunstância**.

### 1.1. Prioridades Estratégicas

1. **Segurança Máxima** — A plataforma deve ser uma fortaleza impenetrável contra ataques, fraudes e acesso não autorizado.
2. **Engajamento e Recomendação** — Personalização de experiência para aumentar retenção e conversão.
3. **Conformidade Legal** — Aderência total ao ECA Digital, LGPD e legislação de direitos autorais brasileira.
4. **Monitoramento Contínuo** — Visibilidade total sobre comportamento de usuários, segurança e performance.

### 1.2. Stack Técnico Confirmado

- **Backend:** Express.js + tRPC (já inicializado)
- **Banco de Dados:** MySQL/TiDB (Supabase)
- **Autenticação:** Clerk + Manus OAuth
- **Segurança:** Cloudflare, Snyk, Sentry
- **Analytics:** PostHog
- **Notificações:** Resend (e-mail)
- **Verificação de Identidade:** FonteData (CPF)

---

## 2. Módulo 1: Segurança e Proteção

### 2.1. Verificação de CPF (ECA Digital & Prevenção de Fraudes)

**Objetivo:** Validar a identidade dos usuários no cadastro, garantir conformidade com o ECA Digital (Lei 15.211/2025) para conteúdo +16 e prevenir fraudes.

**Requisitos Técnicos:**

- Integrar API de verificação de CPF (FonteData ou similar) no fluxo de cadastro.
- Validação em duas camadas:
  - **Frontend:** Validação de formato (Mod-11) para feedback imediato.
  - **Backend:** Chamada à API de verificação na Receita Federal para confirmar existência, situação cadastral e dados.
- Armazenar status de verificação no Clerk `publicMetadata` (ex: `cpf_verified: true`, `cpf_status: 'REGULAR'`).
- Lógica de decisão:
  - **Aprovado:** CPF válido, regular e sem óbito registrado.
  - **Revisão Manual:** Situação pendente ou divergência de dados.
  - **Bloqueado:** CPF cancelado, nulo, ou titular falecido.
- Implementar tRPC procedure `user.verifyCPF` (protegido, apenas durante cadastro).
- Armazenar logs de tentativas de verificação na tabela `audit_logs` para rastreabilidade.
- **Conformidade LGPD:** Consentimento explícito antes da coleta; dados de CPF criptografados em repouso; retenção máxima de 90 dias após verificação.

**Banco de Dados:**

```sql
-- Tabela de verificação de CPF (adicionar a schema.ts)
CREATE TABLE cpf_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  cpfHash VARCHAR(255) NOT NULL,
  status ENUM('REGULAR', 'PENDENTE', 'CANCELADA', 'NULA', 'FALECIDO') NOT NULL,
  verifiedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expiresAt TIMESTAMP,
  apiResponse JSON,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (userId, status)
);
```

**Endpoints tRPC:**

- `user.verifyCPF(cpf: string, birthDate: string)` → `{ success: boolean, status: string, message: string }`
- `admin.getCPFVerificationLogs()` → Lista de verificações com filtros por status, data, usuário.

---

### 2.2. Rate Limiting e Proteção contra Bots

**Objetivo:** Prevenir ataques de força bruta, scraping e abuso de API.

**Requisitos Técnicos:**

- Implementar rate limiting por IP usando Upstash Redis:
  - Login: máx. 5 tentativas por 15 minutos.
  - Cadastro: máx. 3 por hora por IP.
  - Verificação de CPF: máx. 10 por dia por usuário.
  - API geral: máx. 100 requisições por minuto por IP.
- Middleware Express para rate limiting em `/api/trpc/*`.
- Detectar e bloquear padrões suspeitos:
  - Múltiplos cadastros do mesmo IP em curto período (> 5 em 1 hora).
  - Múltiplas tentativas de login falhadas (> 10 em 30 minutos).
  - User-Agent suspeitos ou ausentes.
- Integração com Cloudflare para bloqueio de bots em camada de borda.
- Logs de bloqueios em `security_events` para análise posterior.

**Banco de Dados:**

```sql
CREATE TABLE security_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  eventType ENUM('RATE_LIMIT', 'SUSPICIOUS_LOGIN', 'SUSPICIOUS_SIGNUP', 'BOT_DETECTED', 'SCRAPING', 'BRUTE_FORCE') NOT NULL,
  ipAddress VARCHAR(45) NOT NULL,
  userId INT,
  details JSON,
  blockedUntil TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX (ipAddress, createdAt),
  INDEX (userId, createdAt),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);
```

**Implementação:**

- Middleware `rateLimitMiddleware.ts` usando Upstash Redis.
- Função `checkSuspiciousActivity(ip, userId)` que retorna `{ isSuspicious: boolean, action: 'ALLOW' | 'BLOCK' | 'CHALLENGE' }`.
- Endpoint admin para visualizar e gerenciar bloqueios: `admin.getSecurityEvents()`.

---

### 2.3. Proteção contra SQL Injection, XSS e CSRF

**Objetivo:** Garantir que a plataforma seja resistente aos ataques mais comuns.

**Requisitos Técnicos:**

- **SQL Injection:** Usar Drizzle ORM (já em uso) — nunca concatenar strings em queries. Validação de entrada com Zod em todos os endpoints.
- **XSS:** Sanitizar todas as entradas de usuário (títulos de mangás, comentários, etc.) usando `DOMPurify` no frontend e `sanitize-html` no backend.
- **CSRF:** Implementar tokens CSRF em formulários sensíveis (alteração de perfil, exclusão de conta). Usar middleware `csrf` do Express.
- **Headers de Segurança HTTP:**
  - `Content-Security-Policy`: Restringir fontes de script, estilo e mídia.
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- Middleware `securityHeaders.ts` que aplica todos os headers automaticamente.
- Validação rigorosa com Zod em todos os tRPC procedures.

**Implementação:**

```ts
// server/_core/securityHeaders.ts
export function securityHeadersMiddleware(req, res, next) {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net ; style-src 'self' 'unsafe-inline'");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
}
```

---

### 2.4. Integração com Cloudflare WAF

**Objetivo:** Proteção de borda contra ataques DDoS, IPs maliciosos e tráfego suspeito.

**Requisitos Técnicos:**

- Configurar Cloudflare WAF com regras pré-definidas:
  - Bloqueio de IPs conhecidos como maliciosos (atualizado diariamente).
  - Detecção de DDoS com rate limiting automático.
  - Bloqueio de User-Agents suspeitos (bots, scrapers).
  - Verificação de desafio (CAPTCHA) para tráfego suspeito.
- Configurar Page Rules no Cloudflare:
  - Cache de conteúdo estático (imagens, CSS, JS) por 30 dias.
  - Bypass de cache para `/api/trpc/*` (sempre fresco).
- Logs de bloqueios do Cloudflare integrados com Sentry para alertas.
- Dashboard Cloudflare acessível ao admin para visualizar ataques bloqueados.

**Configuração:**

- Arquivo `cloudflare.json` com regras WAF (versionar no repositório).
- Script de deploy que sincroniza regras automaticamente.
- Webhook do Cloudflare → Sentry para alertas em tempo real.

---

### 2.5. Auditoria de Vulnerabilidades com Snyk

**Objetivo:** Monitorar continuamente dependências e código em busca de vulnerabilidades conhecidas.

**Requisitos Técnicos:**

- Integrar Snyk ao repositório GitHub:
  - Verificação automática de PRs em busca de vulnerabilidades.
  - Bloqueio de merge se vulnerabilidades críticas forem detectadas.
  - Relatórios semanais de vulnerabilidades.
- Configurar `snyk.json` na raiz do projeto com políticas:
  - Fail on: `high` e `critical`.
  - Ignore: vulnerabilidades com patches indisponíveis (com aprovação manual).
- CI/CD pipeline (GitHub Actions):
  - `snyk test` antes de cada deploy.
  - `snyk monitor` para rastreamento contínuo.
- Dashboard Snyk acessível ao admin com histórico de vulnerabilidades.

**Configuração:**

```json
{
  "version": "1.0.0",
  "failOn": "high",
  "autofix": true,
  "prTestMode": true
}
```

---

### 2.6. Monitoramento de Erros com Sentry

**Objetivo:** Capturar e alertar sobre erros em tempo real, tanto no backend quanto no frontend.

**Requisitos Técnicos:**

- Integração Sentry no backend (Express):
  - Captura de exceções não tratadas.
  - Rastreamento de transações (performance).
  - Contexto de usuário e requisição em cada erro.
- Integração Sentry no frontend (React):
  - Captura de erros de componentes.
  - Rastreamento de eventos de usuário.
  - Performance monitoring (Web Vitals).
- Alertas automáticos:
  - Erro crítico → notificação imediata ao admin.
  - Taxa de erro > 5% → alerta.
  - Performance degradada → alerta.
- Dashboard Sentry com filtros por severidade, usuário, endpoint.
- Retenção de eventos por 90 dias.

**Implementação:**

```ts
// server/_core/sentry.ts
import * as Sentry from "@sentry/node";

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ request: true, serverName: true }),
    ],
  });
}

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context });
}
```

---

### 2.7. Detecção de Atividade Suspeita e Alertas Automáticos

**Objetivo:** Identificar padrões anômalos de acesso e bloquear automaticamente usuários/IPs maliciosos.

**Requisitos Técnicos:**

- Monitoramento contínuo de padrões:
  - **Múltiplos cadastros por IP:** > 5 em 1 hora → investigar.
  - **Tentativas de força bruta:** > 10 logins falhados em 30 min → bloquear IP por 24h.
  - **Scraping de conteúdo:** Requisições repetidas ao mesmo endpoint sem interação → bloquear.
  - **Acesso geográfico anômalo:** Login de país diferente do cadastro → desafio de segurança.
  - **Mudanças de perfil suspeitas:** Alteração de e-mail, senha, CPF em sequência rápida → verificação.
- Algoritmo de scoring de risco:
  - Cada evento suspeito adiciona pontos.
  - Score > 50 → bloqueio automático com notificação.
  - Score 30-50 → desafio de segurança (verificação de e-mail, SMS).
  - Score < 30 → monitoramento contínuo.
- Alertas automáticos:
  - Email ao admin com detalhes do evento.
  - Notificação ao usuário se sua conta foi bloqueada.
  - Log em `security_events` para auditoria.
- Dashboard admin com:
  - Lista de usuários/IPs bloqueados.
  - Histórico de eventos suspeitos.
  - Opção de desbloqueio manual com justificativa.

**Banco de Dados:**

```sql
CREATE TABLE user_risk_scores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  ipAddress VARCHAR(45),
  riskScore INT DEFAULT 0,
  lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  blockedUntil TIMESTAMP,
  reason VARCHAR(255),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (riskScore, blockedUntil)
);

CREATE TABLE anomaly_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  ipAddress VARCHAR(45),
  anomalyType ENUM('BRUTE_FORCE', 'SCRAPING', 'GEO_ANOMALY', 'PROFILE_CHANGE', 'SIGNUP_SPIKE') NOT NULL,
  riskPoints INT,
  details JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  INDEX (userId, createdAt),
  INDEX (ipAddress, createdAt)
);
```

**Implementação:**

- Função `calculateRiskScore(userId, event)` que retorna novo score.
- Job agendado (Heartbeat) que executa a cada 5 minutos para verificar scores e bloquear usuários.
- Endpoint admin: `admin.getUserRiskProfile(userId)` → histórico completo de eventos.

---

## 3. Módulo 2: Analytics e Notificações

### 3.1. Analytics de Comportamento com PostHog

**Objetivo:** Rastrear leitura, engajamento e funil de conversão para otimizar a plataforma.

**Requisitos Técnicos:**

- Integração PostHog no frontend (React):
  - Rastreamento de eventos: `manga_opened`, `chapter_read`, `series_followed`, `premium_viewed`, `share_clicked`.
  - Propriedades de evento: `mangaId`, `chapterId`, `readTime`, `userSegment`, `device`.
  - Identificação de usuário com `userId` do Clerk.
- Integração PostHog no backend:
  - Eventos de negócio: `user_signup`, `cpf_verified`, `subscription_started`, `subscription_canceled`.
  - Eventos de segurança: `suspicious_activity_detected`, `ip_blocked`, `user_blocked`.
- Dashboards pré-configurados:
  - **Funil de Conversão:** Signup → CPF Verificado → Premium → Ativo.
  - **Engajamento:** Leituras por dia, tempo médio de leitura, séries mais seguidas.
  - **Retenção:** Usuários ativos por semana, churn rate.
  - **Segurança:** Eventos suspeitos, IPs bloqueados, tentativas de fraude.
- Segmentação de usuários:
  - Por comportamento: leitores casuais, leitores frequentes, premium.
  - Por geografia: Brasil, exterior.
  - Por device: mobile, desktop.
- Exportação de dados para análise externa (CSV, JSON) via endpoint admin.

**Implementação:**

```ts
// client/src/_core/analytics.ts
import posthog from 'posthog-js';

export function initPostHog() {
  posthog.init(process.env.VITE_POSTHOG_KEY, {
    api_host: process.env.VITE_POSTHOG_HOST,
  });
}

export function trackEvent(event: string, properties?: Record<string, any>) {
  posthog.capture(event, properties);
}

// server/analytics.ts
import { PostHog } from 'posthog-node';

const posthog = new PostHog(process.env.POSTHOG_KEY, {
  host: process.env.POSTHOG_HOST,
});

export async function trackServerEvent(userId: string, event: string, properties?: Record<string, any>) {
  posthog.capture({
    distinctId: userId,
    event,
    properties,
  });
}
```

---

### 3.2. Sistema de Notificações por E-mail (Resend)

**Objetivo:** Manter usuários informados sobre eventos importantes e novos conteúdos.

**Requisitos Técnicos:**

- Integração Resend para envio de e-mails transacionais:
  - Confirmação de cadastro (com link de verificação).
  - Notificação de novo capítulo (série seguida).
  - Alertas de segurança (login de novo dispositivo, alteração de perfil).
  - Notificação de desbloqueio (se conta foi bloqueada por suspeita).
- Templates de e-mail profissionais (HTML):
  - Respeitando identidade visual (fundo creme, tipografia serif Didone).
  - Responsivos para mobile.
  - Links rastreáveis para analytics.
- Preferências de notificação:
  - Usuário pode desabilitar notificações de novos capítulos.
  - Usuário pode escolher frequência (imediato, diário, semanal).
  - Usuário pode desabilitar alertas de segurança (não recomendado).
- Fila de e-mails com retry automático:
  - Usar Upstash Redis para fila.
  - Job que processa fila a cada 1 minuto.
  - Máximo 3 tentativas antes de marcar como falha.
- Logs de e-mails enviados em `email_logs` para auditoria.

**Banco de Dados:**

```sql
CREATE TABLE email_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  emailType ENUM('SIGNUP_CONFIRMATION', 'NEW_CHAPTER', 'SECURITY_ALERT', 'ACCOUNT_BLOCKED', 'WEEKLY_DIGEST') NOT NULL,
  recipientEmail VARCHAR(320),
  status ENUM('SENT', 'FAILED', 'BOUNCED') NOT NULL,
  sentAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (userId, emailType, sentAt)
);

CREATE TABLE user_notification_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  newChapterNotifications BOOLEAN DEFAULT TRUE,
  newChapterFrequency ENUM('IMMEDIATE', 'DAILY', 'WEEKLY') DEFAULT 'DAILY',
  securityAlerts BOOLEAN DEFAULT TRUE,
  weeklyDigest BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

**Implementação:**

- Função `sendEmail(userId, emailType, data)` que adiciona à fila.
- Job `processEmailQueue()` que executa a cada 1 minuto.
- Endpoint user: `user.updateNotificationPreferences(preferences)`.
- Endpoint admin: `admin.getEmailLogs()` com filtros por tipo, status, data.

---

### 3.3. E-mails Semanais Personalizados com Recomendações

**Objetivo:** Aumentar engajamento enviando recomendações personalizadas e resumo de novos capítulos.

**Requisitos Técnicos:**

- Job agendado (Heartbeat) que executa toda segunda-feira às 08:00:
  - Para cada usuário com `weeklyDigest = TRUE`:
    - Coletar mangás seguidos com novos capítulos na semana.
    - Gerar 3-5 recomendações personalizadas baseadas em histórico.
    - Compilar em e-mail HTML com links rastreáveis.
    - Enviar via Resend.
- Recomendações baseadas em:
  - Gêneros favoritos (extraído do histórico de leitura).
  - Similaridade com mangás já lidos (usando Pinecone para busca vetorial).
  - Popularidade entre usuários com perfil similar.
  - Novos lançamentos em gêneros de interesse.
- Template de e-mail:
  - Seção "Novos Capítulos" com 5-10 séries seguidas.
  - Seção "Recomendado para Você" com 3-5 mangás.
  - Links com `utm_source=weekly_digest` para rastreamento.
  - Botão de preferências para desabilitar.
- Rastreamento de cliques:
  - Cada link contém `email_id` e `recommendation_id`.
  - Quando usuário clica, registrar em `recommendation_clicks`.
  - Usar dados para melhorar algoritmo de recomendação.

**Banco de Dados:**

```sql
CREATE TABLE recommendation_clicks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  mangaId INT NOT NULL,
  emailId INT,
  recommendationType ENUM('WEEKLY_DIGEST', 'NEW_CHAPTER', 'PERSONALIZED') NOT NULL,
  clickedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (userId, mangaId, recommendationType)
);
```

**Implementação:**

- Job `sendWeeklyDigests()` agendado para segunda-feira 08:00.
- Função `generateRecommendations(userId, count)` que usa Pinecone + histórico.
- Função `generateWeeklyDigestEmail(userId)` que compila e-mail.
- Rastreamento de cliques via middleware que intercepta links.

---

## 4. Módulo 3: Recomendação e Administração

### 4.1. Sistema de Recomendação Personalizada

**Objetivo:** Sugerir mangás relevantes baseado em histórico e preferências do usuário.

**Requisitos Técnicos:**

- Análise de histórico de leitura:
  - Extrair gêneros, autores, temas dos mangás lidos.
  - Calcular "preferência vetorial" do usuário.
  - Armazenar vetor em Pinecone para busca semântica.
- Algoritmo de recomendação (híbrido):
  - **Filtragem Colaborativa:** Encontrar usuários com perfil similar e recomendar mangás que eles leem.
  - **Filtragem por Conteúdo:** Buscar mangás similares aos que o usuário já leu (usando Pinecone).
  - **Popularidade:** Dar peso a mangás populares entre usuários similares.
  - **Novidade:** Priorizar lançamentos recentes em gêneros de interesse.
- Endpoints tRPC:
  - `manga.getRecommendations(count?: number)` → Lista de 5-10 mangás recomendados.
  - `manga.getSimilarManga(mangaId)` → Mangás similares ao especificado.
  - `user.getRecommendationFeedback(mangaId, liked: boolean)` → Feedback para melhorar algoritmo.
- Atualização de vetores:
  - Quando usuário lê um mangá, atualizar vetor no Pinecone.
  - Job agendado (diário) que recalcula vetores para todos os usuários.
- Cache de recomendações:
  - Armazenar recomendações em Redis por 24h.
  - Invalidar cache quando usuário lê novo mangá.

**Implementação:**

```ts
// server/routers/recommendations.ts
import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

export async function generateRecommendations(userId: string, count: number = 5) {
  // 1. Obter vetor do usuário do Pinecone
  const userVector = await getUserVector(userId);
  
  // 2. Buscar mangás similares
  const results = await pinecone.Index('manga-vectors').query({
    vector: userVector,
    topK: count * 2,
    includeMetadata: true,
  });
  
  // 3. Filtrar mangás já lidos
  const recommendations = await filterAlreadyRead(userId, results);
  
  // 4. Aplicar scoring (popularidade, novidade, etc.)
  const scored = await scoreRecommendations(userId, recommendations);
  
  return scored.slice(0, count);
}
```

---

### 4.2. Painel Administrativo

**Objetivo:** Gerenciar mangás, capítulos, usuários e visualizar logs de segurança.

**Requisitos Técnicos:**

- Dashboard admin com seções:
  - **Gerenciamento de Mangás:** CRUD de mangás, upload de capas, edição de metadados.
  - **Gerenciamento de Capítulos:** Upload de capítulos, edição de números, datas de publicação.
  - **Gerenciamento de Usuários:** Visualizar perfis, bloquear/desbloquear, alterar role.
  - **Logs de Segurança:** Visualizar eventos suspeitos, bloqueios, tentativas de fraude.
  - **Analytics:** Dashboards de engajamento, retenção, conversão.
  - **E-mails:** Visualizar logs de envio, reenviar e-mails falhados.
- Permissões:
  - Apenas usuários com `role = 'admin'` podem acessar.
  - Proteção de rota no frontend e validação no backend.
- Endpoints tRPC (todos com `adminProcedure`):
  - `admin.getMangaList(filters, pagination)` → Lista de mangás com filtros.
  - `admin.createManga(data)` → Criar novo mangá.
  - `admin.updateManga(mangaId, data)` → Editar mangá.
  - `admin.deleteManga(mangaId)` → Deletar mangá (soft delete).
  - `admin.uploadChapter(mangaId, chapterData)` → Upload de capítulo.
  - `admin.getUserList(filters, pagination)` → Lista de usuários.
  - `admin.blockUser(userId, reason, duration)` → Bloquear usuário.
  - `admin.getSecurityEvents(filters, pagination)` → Logs de segurança.
  - `admin.getAnalyticsDashboard()` → Dados para dashboard.
  - `admin.getEmailLogs(filters, pagination)` → Logs de e-mail.
- Interface responsiva:
  - Tabelas com paginação, filtros e busca.
  - Modais para criar/editar.
  - Gráficos para analytics (usando Recharts).
  - Notificações em tempo real de eventos de segurança.

**Banco de Dados (adicionar a schema.ts):**

```sql
CREATE TABLE admin_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  adminId INT NOT NULL,
  actionType ENUM('CREATE_MANGA', 'UPDATE_MANGA', 'DELETE_MANGA', 'BLOCK_USER', 'UNBLOCK_USER', 'VIEW_LOGS') NOT NULL,
  targetId INT,
  details JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (adminId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX (adminId, createdAt)
);
```

---

## 5. Banco de Dados: Schema Completo

Todas as tabelas abaixo devem ser adicionadas ao `drizzle/schema.ts`:

```ts
import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean } from "drizzle-orm/mysql-core";

// Tabelas existentes (não alterar)
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// Novas tabelas para segurança
export const cpfVerifications = mysqlTable("cpf_verifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  cpfHash: varchar("cpfHash", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["REGULAR", "PENDENTE", "CANCELADA", "NULA", "FALECIDO"]).notNull(),
  verifiedAt: timestamp("verifiedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  apiResponse: json("apiResponse"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const securityEvents = mysqlTable("security_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: mysqlEnum("eventType", ["RATE_LIMIT", "SUSPICIOUS_LOGIN", "SUSPICIOUS_SIGNUP", "BOT_DETECTED", "SCRAPING", "BRUTE_FORCE"]).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(),
  userId: int("userId"),
  details: json("details"),
  blockedUntil: timestamp("blockedUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const userRiskScores = mysqlTable("user_risk_scores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  riskScore: int("riskScore").default(0).notNull(),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  blockedUntil: timestamp("blockedUntil"),
  reason: varchar("reason", { length: 255 }),
});

export const anomalyLogs = mysqlTable("anomaly_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  anomalyType: mysqlEnum("anomalyType", ["BRUTE_FORCE", "SCRAPING", "GEO_ANOMALY", "PROFILE_CHANGE", "SIGNUP_SPIKE"]).notNull(),
  riskPoints: int("riskPoints").notNull(),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const emailLogs = mysqlTable("email_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  emailType: mysqlEnum("emailType", ["SIGNUP_CONFIRMATION", "NEW_CHAPTER", "SECURITY_ALERT", "ACCOUNT_BLOCKED", "WEEKLY_DIGEST"]).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }),
  status: mysqlEnum("status", ["SENT", "FAILED", "BOUNCED"]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
});

export const userNotificationPreferences = mysqlTable("user_notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  newChapterNotifications: boolean("newChapterNotifications").default(true).notNull(),
  newChapterFrequency: mysqlEnum("newChapterFrequency", ["IMMEDIATE", "DAILY", "WEEKLY"]).default("DAILY").notNull(),
  securityAlerts: boolean("securityAlerts").default(true).notNull(),
  weeklyDigest: boolean("weeklyDigest").default(true).notNull(),
});

export const recommendationClicks = mysqlTable("recommendation_clicks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  mangaId: int("mangaId").notNull(),
  emailId: int("emailId"),
  recommendationType: mysqlEnum("recommendationType", ["WEEKLY_DIGEST", "NEW_CHAPTER", "PERSONALIZED"]).notNull(),
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
});

export const adminActions = mysqlTable("admin_actions", {
  id: int("id").autoincrement().primaryKey(),
  adminId: int("adminId").notNull(),
  actionType: mysqlEnum("actionType", ["CREATE_MANGA", "UPDATE_MANGA", "DELETE_MANGA", "BLOCK_USER", "UNBLOCK_USER", "VIEW_LOGS"]).notNull(),
  targetId: int("targetId"),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 255 }).notNull(),
  details: json("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

---

## 6. Variáveis de Ambiente Necessárias

Adicionar ao `.env` (via `webdev_request_secrets`):

```env
# Verificação de CPF
FONTDATA_API_KEY=<chave_da_fontdata>
FONTDATA_API_URL=https://app.fontedata.com/api/v1 

# Redis (Upstash)
UPSTASH_REDIS_URL=<url_redis>
UPSTASH_REDIS_TOKEN=<token_redis>

# Sentry
SENTRY_DSN=<dsn_sentry>

# PostHog
POSTHOG_KEY=<chave_posthog>
POSTHOG_HOST=<host_posthog>
VITE_POSTHOG_KEY=<chave_posthog_frontend>
VITE_POSTHOG_HOST=<host_posthog_frontend>

# Resend
RESEND_API_KEY=<chave_resend>

# Pinecone
PINECONE_API_KEY=<chave_pinecone>
PINECONE_INDEX_NAME=manga-vectors

# Cloudflare
CLOUDFLARE_ZONE_ID=<zone_id>
CLOUDFLARE_API_TOKEN=<api_token>

# Snyk
SNYK_TOKEN=<token_snyk>

# Admin Email
ADMIN_EMAIL=admin@example.com
```

---

## 7. Estrutura de Arquivos (Backend)

```
server/
├── _core/
│   ├── securityHeaders.ts          # Middleware de headers HTTP
│   ├── rateLimiting.ts             # Rate limiting com Redis
│   ├── sentry.ts                   # Inicialização do Sentry
│   ├── anomalyDetection.ts         # Detecção de atividade suspeita
│   └── index.ts                    # (já existe, adicionar middlewares)
├── routers/
│   ├── user.ts                     # Procedures de usuário (verifyCPF, etc)
│   ├── recommendations.ts          # Sistema de recomendação
│   ├── admin.ts                    # Procedures administrativas
│   ├── analytics.ts                # Tracking de eventos
│   └── notifications.ts            # Gerenciamento de notificações
├── services/
│   ├── cpfVerification.ts          # Integração com FonteData
│   ├── emailService.ts             # Integração com Resend
│   ├── securityService.ts          # Lógica de segurança
│   ├── recommendationEngine.ts     # Algoritmo de recomendação
│   └── analyticsService.ts         # Rastreamento de eventos
├── jobs/
│   ├── processEmailQueue.ts        # Job para envio de e-mails
│   ├── sendWeeklyDigests.ts        # Job para digests semanais
│   ├── recalculateRiskScores.ts    # Job para recalcular scores
│   ├── updatePineconeVectors.ts    # Job para atualizar vetores
│   └── cleanupExpiredData.ts       # Job para limpeza de dados
├── db.ts                           # (já existe, adicionar queries)
└── routers.ts                      # (já existe, adicionar routers)
```

---

## 8. Checklist de Implementação

- [ ] **Segurança:**
  - [ ] Integração com FonteData para verificação de CPF
  - [ ] Rate limiting com Upstash Redis
  - [ ] Proteção contra SQL Injection, XSS, CSRF
  - [ ] Headers de segurança HTTP
  - [ ] Integração com Cloudflare WAF
  - [ ] Integração com Snyk (CI/CD)
  - [ ] Integração com Sentry (backend + frontend)
  - [ ] Detecção de atividade suspeita com scoring de risco
  - [ ] Sistema automatizado de bloqueio e alertas

- [ ] **Analytics e Notificações:**
  - [ ] Integração com PostHog (frontend + backend)
  - [ ] Dashboards de engajamento, retenção, conversão
  - [ ] Integração com Resend para e-mails transacionais
  - [ ] Sistema de preferências de notificação
  - [ ] Fila de e-mails com retry automático
  - [ ] Job de envio de digests semanais com recomendações

- [ ] **Recomendação:**
  - [ ] Integração com Pinecone para busca vetorial
  - [ ] Algoritmo híbrido de recomendação
  - [ ] Endpoints de recomendação e feedback
  - [ ] Job de atualização de vetores

- [ ] **Administração:**
  - [ ] Painel administrativo (UI já existe no front-end)
  - [ ] Endpoints tRPC para CRUD de mangás, capítulos, usuários
  - [ ] Visualização de logs de segurança
  - [ ] Dashboards de analytics
  - [ ] Gerenciamento de bloqueios e alertas

- [ ] **Banco de Dados:**
  - [ ] Todas as tabelas adicionadas a `drizzle/schema.ts`
  - [ ] Migrations geradas e aplicadas
  - [ ] Índices criados para performance

- [ ] **Variáveis de Ambiente:**
  - [ ] Todas as chaves de API adicionadas via `webdev_request_secrets`
  - [ ] `.env` configurado localmente para testes

- [ ] **Testes:**
  - [ ] Testes unitários para serviços críticos (CPF, recomendação, segurança)
  - [ ] Testes de integração para endpoints tRPC
  - [ ] Testes de carga para rate limiting

- [ ] **Documentação:**
  - [ ] README atualizado com instruções de setup
  - [ ] Documentação de APIs (endpoints tRPC)
  - [ ] Guia de operação do painel admin

---

## 9. Observações Importantes

1. **Front-end Intocável:** O front-end já foi entregue com identidade visual sofisticada. Nenhuma alteração deve ser feita sem aprovação explícita.

2. **Assinaturas Premium:** Sistema já implementado. Não alterar, não reescrever, não tocar.

3. **Conformidade Legal:** Todas as integrações devem respeitar LGPD, ECA Digital e legislação de direitos autorais brasileira.

4. **Performance:** Usar caching (Redis) agressivamente para reduzir latência. Índices no banco de dados são críticos.

5. **Segurança em Profundidade:** Múltiplas camadas de proteção (rate limiting, WAF, detecção de anomalias, etc.) são essenciais.

6. **Monitoramento Contínuo:** Sentry, PostHog e logs de segurança devem estar sempre ativos para visibilidade total.

7. **Testes:** Cada funcionalidade crítica deve ter testes automatizados. Usar Vitest para testes unitários e de integração.

---

## 10. Próximos Passos

1. Ler este documento completamente.
2. Criar branches Git para cada módulo (segurança, analytics, recomendação, admin).
3. Implementar módulos na ordem: Segurança → Analytics → Recomendação → Admin.
4. Testar cada funcionalidade localmente antes de fazer push.
5. Solicitar code review antes de merge para main.
6. Após conclusão, gerar novo checkpoint e preparar para deploy.

---

**Documento preparado por:** Manus AI  
**Data de Criação:** Maio de 2026  
**Versão:** 1.0  
**Status:** Pronto para Implementação
