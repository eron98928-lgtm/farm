# 🚀 IMPLEMENTAÇÃO - MANGAREADER PRODUCTION

**Data**: 04 de Junho de 2026  
**Status**: Em Progresso 🔄

---

## ✅ TAREFA 1 - COMPLETADA

### Conectar Painel Admin aos Endpoints Reais

**O que foi feito**:

1. **API Client (`src/lib/api.ts`)**
   - ✅ Adicionadas funções `create`, `update`, `delete` para mangas
   - ✅ Tipagem completa com Zod validation
   - ✅ Suporte para slug em todas as operações

2. **Tipo Manga (`src/data/mangas.ts`)**
   - ✅ Adicionado campo `slug: string`
   - ✅ Exemplos de slugs adicionados aos primeiros mangás

3. **Formulário (`src/pages/admin/AdminMangaForm.tsx`)**
   - ✅ Campo slug adicionado ao form
   - ✅ Validação de slug obrigatório
   - ✅ UI melhorada com erro messages

4. **Dashboard (`src/pages/admin/AdminDashboard.tsx`)**
   - ✅ Reescrito para usar API real (não mais mock)
   - ✅ useEffect para carregar dados ao montar
   - ✅ Handlers async para create, update, delete
   - ✅ Loading spinner durante operações
   - ✅ Error alerts com dismissible
   - ✅ Fallback para mock data se API falhar

**Como testar**:

```bash
# Frontend deve estar rodando em http://localhost:5173
# Backend em http://localhost:3000

# Acesse: http://localhost:5173/admin
# Login com qualquer email/senha
# Tente criar/editar/deletar um mangá
```

---

## 🔄 TAREFA 2 - EM PROGRESSO

### Implementar Upload com Cloudflare R2 + Sharp

**O que foi preparado**:

1. **Upload Handler (`backend/src/server/uploadHandler.ts`)**
   - ✅ Router Express criado `/api/upload`
   - ✅ Endpoint `/api/upload/chapter-pages` implementado
   - ✅ Processamento com sharp:
     - Remove metadados EXIF
     - Converte para WebP (qualidade 85)
     - Redimensiona para max 1200px largura
   - ✅ Upload para Cloudflare R2 com S3 client
   - ✅ Retorna URLs públicas

2. **Backend Integration (`backend/src/index.ts`)**
   - ✅ Multer configurado (50MB limit, apenas imagens)
   - ✅ Router registrado em `/api/upload`
   - ✅ Middleware de upload integrado

3. **API Client (`src/lib/api.ts`)**
   - ✅ Função `api.uploads.uploadChapterPages()` adicionada
   - ✅ Suporte a múltiplos arquivos
   - ✅ Retorna páginas processadas com URLs

**Próximos passos para completar Tarefa 2**:

1. **Instalar dependências no backend**:

```bash
cd backend
npm install sharp @aws-sdk/client-s3 multer
npm install --save-dev @types/multer
```

2. **Configurar variáveis de ambiente** em `backend/.env`:

```env
# Cloudflare R2
R2_ACCESS_KEY_ID=seu_access_key
R2_SECRET_ACCESS_KEY=seu_secret_key
R2_ENDPOINT_URL=https://sua-conta.r2.cloudflarestorage.com
R2_BUCKET_NAME=mangareader
R2_PUBLIC_URL=https://seu-dominio-publico.com/images
```

3. **Adicionar UI de Upload** em `src/pages/admin/AdminChapters.tsx`:
   - Input file com múltiplos arquivos
   - Preview de imagens antes do upload
   - Progress bar durante upload
   - Integração com `api.uploads.uploadChapterPages()`
   - Salvar URLs no banco via `api.chapters.uploadPages()`

4. **Testar end-to-end**:
   ```bash
   # 1. Admin Panel → Selecionar manga
   # 2. Aba "Capítulos" → Criar novo capítulo
   # 3. Botão "Upload de Páginas"
   # 4. Selecionar 3-5 imagens (PNG, JPG)
   # 5. Verificar se foram processadas e enviadas para R2
   ```

---

## 📋 TAREFAS RESTANTES

### TAREFA 3 - Remover Obrigatoriedade de CPF

**O que fazer**:

1. Remove campo CPF do formulário de registro (`src/pages/admin/AdminLogin.tsx`)
2. Simplifica fluxo para apenas email + senha
3. Remove verificação CPF do AgeGate.tsx
4. Backend: desativar endpoints de CPF (já estão comentados)

**Estimado**: 15 minutos

### TAREFA 4 - Seed de Conteúdo

**O que fazer**:

1. Criar script `backend/scripts/seed.ts`
2. Ler dados de `src/data/mangas.ts`
3. Migrar 18 mangás para PostgreSQL
4. Popular capítulos e dados relacionados

**Estimado**: 30 minutos

### TAREFA 5 - Leitor Real com Imagens

**O que fazer**:

1. Modificar `src/components/Reader.tsx`
2. Remover PageCanvas (gradientes decorativos)
3. Adicionar `<img>` tags com URLs reais de chapter_pages
4. Implementar lazy loading + preload de páginas

**Estimado**: 20 minutos

---

## 📞 NOTAS IMPORTANTES

### Cloudflare R2

- API é S3-compatible (AWS SDK v3 funciona perfeitamente)
- URLs públicas requerem configuração de "Public Access"
- Presigned URLs são opccionais (público por padrão se configurado)
- Custos: $0.015/GB stored, $0.015/1M read operations

### Sharp

- `.removeMetadata()` remove EXIF automaticamente
- `.webp({ quality: 85 })` oferece bom balanço tamanho/qualidade
- `.resize()` com `withoutEnlargement: true` não amplia imagens pequenas
- Performance: ~100-200ms por imagem típica (1-5MB)

### Segurança

- Uploads requerem autenticação (`x-session-id` header)
- Rate limiting em `/api/upload` (100 req/min)
- Validação MIME type (apenas imagens)
- Limite de arquivo: 50MB (ajustável no multer config)

---

## 🎯 PRÓXIMOS PASSOS

1. **Hoje (Tarefa 2)**: Instalar deps, testar upload básico
2. **Hoje (Tarefas 3-5)**: Completar implementação restante
3. **Amanhã**: Testes E2E, preparar para produção
4. **Semana**: Deploy em Vercel (frontend) + Railway/Heroku (backend) + R2

---

## 📎 REFERÊNCIAS

- [Sharp Documentation](https://sharp.pixelplumbing.com/)
- [AWS SDK S3 Client](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [tRPC Docs](https://trpc.io/)
- [Express Multer](https://github.com/expressjs/multer)
