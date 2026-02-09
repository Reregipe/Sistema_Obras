# Supabase Backend — Guia Completo de Deploy

> **Projeto**: Sistema de Gestão de Obras EngElétrica  
> **Supabase Project ID**: `czpiltatsbhebdwyazap`  
> **Supabase URL**: `https://czpiltatsbhebdwyazap.supabase.co`  
> **Domínio Frontend**: `obras.engeletrica.net`

---

## Índice

1. [Visão Geral da Arquitetura](#1-visão-geral-da-arquitetura)
2. [Pré-Requisitos](#2-pré-requisitos)
3. [Passo 1 — Projeto Supabase](#3-passo-1--projeto-supabase)
4. [Passo 2 — Instalação do Supabase CLI](#4-passo-2--instalação-do-supabase-cli)
5. [Passo 3 — Linkar Projeto Local ao Cloud](#5-passo-3--linkar-projeto-local-ao-cloud)
6. [Passo 4 — Aplicar Migrations (Schema do Banco)](#6-passo-4--aplicar-migrations-schema-do-banco)
7. [Passo 5 — Verificar o Banco de Dados](#7-passo-5--verificar-o-banco-de-dados)
8. [Passo 6 — Seed Data (Dados de Demonstração)](#8-passo-6--seed-data-dados-de-demonstração)
9. [Passo 7 — Configurar Autenticação](#9-passo-7--configurar-autenticação)
10. [Passo 8 — Deploy das Edge Functions](#10-passo-8--deploy-das-edge-functions)
11. [Passo 9 — Configurar Secrets das Edge Functions](#11-passo-9--configurar-secrets-das-edge-functions)
12. [Passo 10 — Obter as Chaves do Projeto](#12-passo-10--obter-as-chaves-do-projeto)
13. [Passo 11 — Configurar Variáveis de Ambiente](#13-passo-11--configurar-variáveis-de-ambiente)
14. [Passo 12 — Testar a Conexão](#14-passo-12--testar-a-conexão)
15. [Referência Completa — Schema do Banco](#15-referência-completa--schema-do-banco)
16. [Referência Completa — RLS Policies](#16-referência-completa--rls-policies)
17. [Referência Completa — Functions & Triggers](#17-referência-completa--functions--triggers)
18. [Troubleshooting](#18-troubleshooting)

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                    DigitalOcean Droplet                   │
│  ┌──────────────────────────────────────────────────┐    │
│  │         Docker (Nginx + React SPA)                │    │
│  │     https://obras.engeletrica.net                 │    │
│  └──────────────────────────┬───────────────────────┘    │
└─────────────────────────────┼───────────────────────────┘
                              │ HTTPS (REST + Realtime)
                              ▼
┌─────────────────────────────────────────────────────────┐
│                     Supabase Cloud                       │
│  ┌──────────┐  ┌──────────┐  ┌─────────────────────┐   │
│  │ Auth      │  │ PostgREST│  │ Edge Functions      │   │
│  │ (JWT)     │  │ (API)    │  │ - send-invite-email │   │
│  │           │  │          │  │ - send-notification  │   │
│  └──────────┘  └──────────┘  └─────────────────────┘   │
│  ┌───────────────────────────────────────────────────┐  │
│  │              PostgreSQL Database                   │  │
│  │  23+ tables, RLS, triggers, functions             │  │
│  │  Realtime enabled (notificacoes, user_roles_hist) │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Como funciona:**
- O **frontend** (React SPA) roda no Droplet dentro de um container Docker + Nginx
- O **backend inteiro** roda no Supabase Cloud, incluindo:
  - **PostgreSQL** — banco de dados com 23+ tabelas, RLS, triggers, functions
  - **Auth** — autenticação via email/senha com JWT
  - **PostgREST** — API REST automática sobre as tabelas (acessada via `supabase-js`)
  - **Edge Functions** — 2 funções Deno para envio de emails
  - **Realtime** — WebSocket para notificações em tempo real
- O frontend se comunica com o Supabase via a library `@supabase/supabase-js` usando a **anon key** (chave pública)
- Toda autorização é feita via **Row Level Security (RLS)** no PostgreSQL

---

## 2. Pré-Requisitos

| Item | Detalhes |
|------|----------|
| **Conta Supabase** | Gratuita em [supabase.com](https://supabase.com) (Free tier: 500MB DB, 50K auth users, 500K Edge Function invocations/mês) |
| **Node.js** | v18+ instalado na máquina de desenvolvimento |
| **Supabase CLI** | Instalado globalmente (instruções abaixo) |
| **Conta Resend** | Para envio de emails — [resend.com](https://resend.com) (free tier: 100 emails/dia) |
| **Git** | Este repositório clonado localmente |

---

## 3. Passo 1 — Projeto Supabase

### Se o projeto já existe (ID: `czpiltatsbhebdwyazap`)

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Selecione o projeto existente
3. Vá em **Settings → General** e confirme:
   - **Project URL**: `https://czpiltatsbhebdwyazap.supabase.co`
   - **Project Ref**: `czpiltatsbhebdwyazap`
4. Prossiga para o Passo 2

### Se precisa criar um projeto novo

1. Acesse [app.supabase.com](https://app.supabase.com)
2. Clique em **"New Project"**
3. Configure:
   - **Name**: `Sistema Obras` (ou nome desejado)
   - **Database Password**: Escolha uma senha forte (guarde-a!)
   - **Region**: `South America (São Paulo)` — escolha a mais próxima dos seus usuários
   - **Pricing Plan**: Free (ou Pro se necessário)
4. Aguarde ~2 minutos enquanto o projeto é provisionado
5. Anote o **Project Ref** (será o ID tipo `czpiltatsbhebdwyazap`)

---

## 4. Passo 2 — Instalação do Supabase CLI

### Windows (PowerShell)

```powershell
# Opção 1: via npm (recomendado)
npm install -g supabase

# Opção 2: via Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### macOS

```bash
brew install supabase/tap/supabase
```

### Linux

```bash
curl -fsSL https://raw.githubusercontent.com/supabase/cli/main/install.sh | sh
```

### Verificar instalação

```bash
supabase --version
# Deve retornar algo como: 1.x.x
```

### Login no Supabase

```bash
supabase login
```

Isso abrirá o navegador para autenticação. Após login, o CLI terá acesso ao seu projeto.

---

## 5. Passo 3 — Linkar Projeto Local ao Cloud

Na raiz do repositório (onde está o diretório `supabase/`):

```bash
cd c:\Dev\Obras\Sistema_Obras

# Linkar ao projeto Supabase existente
supabase link --project-ref czpiltatsbhebdwyazap
```

Será solicitada a **senha do banco de dados** (a mesma definida na criação do projeto).

### Verificar o link

```bash
supabase status
```

Deve mostrar as URLs e status do projeto remoto.

---

## 6. Passo 4 — Aplicar Migrations (Schema do Banco)

### ⚠️ IMPORTANTE: Correção necessária antes de rodar

O arquivo `supabase/migrations/20260122_create_acionamento_equipes.sql` contém **sintaxe SQLite** (`AUTOINCREMENT`) que **não funciona** no PostgreSQL. 

**Opção A — Deletar o arquivo** (recomendado, pois a tabela já é criada por migrações anteriores):

```powershell
Remove-Item "supabase\migrations\20260122_create_acionamento_equipes.sql"
```

**Opção B — Se quiser manter**, substitua o conteúdo por:

```sql
-- Tabela auxiliar para vincular equipes a acionamentos (já existe via migrações anteriores)
-- Esta migração é um no-op; a tabela acionamento_equipes já foi criada com schema correto.
SELECT 1;
```

### Aplicar as Migrations

```bash
# Ver quais migrations serão aplicadas
supabase db push --dry-run

# Aplicar todas as migrations ao banco remoto
supabase db push
```

O comando `supabase db push` executa todos os arquivos `.sql` em `supabase/migrations/` em ordem cronológica no banco de dados Supabase remoto.

### O que as migrations criam:

As 30 migrações (excluindo a SQLite) configuram:

| Categoria | O que é criado |
|-----------|---------------|
| **Tabelas** | 23+ tabelas (usuarios, equipes, acionamentos, obras, materiais, etc.) |
| **Enum** | `app_role` (ADMIN, ADM, OPER, GESTOR, FIN) |
| **RLS** | Row Level Security habilitado em TODAS as tabelas com policies |
| **Functions** | 8 funções PL/pgSQL (has_role, is_admin, handle_new_user, etc.) |
| **Triggers** | 6 triggers (auto-create profile, audit roles, auto-etapa, etc.) |
| **Indexes** | 13 indexes de performance |
| **Realtime** | Habilitado para `notificacoes` e `user_roles_history` |
| **Dados iniciais** | 5 níveis de acesso + 5 system settings |

### Se as migrations falharem

Se alguma migração falhar (por exemplo, tabela já existe de configuração anterior):

```bash
# Verificar o estado atual das migrations
supabase migration list

# Se necessário, marcar migrations como já aplicadas
supabase migration repair <timestamp> --status applied
```

### Alternativa: Aplicar via SQL Editor no Dashboard

Se preferir não usar o CLI, você pode copiar o conteúdo de cada arquivo `.sql` e executá-lo diretamente no **SQL Editor** do Dashboard Supabase (**Database → SQL Editor**), na ordem cronológica.

---

## 7. Passo 5 — Verificar o Banco de Dados

Após aplicar as migrations, verifique pelo Dashboard:

### 7.1 Verificar Tabelas

Vá em **Table Editor** no Dashboard e confirme que estas tabelas existem:

#### Tabelas Principais
- [ ] `usuarios` — cadastro de funcionários/técnicos
- [ ] `acesso_nivel` — níveis de permissão (5 registros pré-carregados)
- [ ] `usuario_acesso` — vínculo entre usuario e nível de acesso
- [ ] `profiles` — perfis vinculados ao Supabase Auth
- [ ] `user_roles` — roles dos usuários (ADMIN, ADM, OPER, etc.)
- [ ] `user_roles_history` — histórico de mudanças de roles
- [ ] `equipes` — equipes de campo
- [ ] `viaturas` — veículos

#### Tabelas Operacionais
- [ ] `acionamentos` — acionamentos (core do sistema, ~50 colunas)
- [ ] `acionamento_equipes` — vínculo acionamento ↔ equipe
- [ ] `acionamento_eventos` — histórico de eventos do acionamento
- [ ] `acionamento_etapa_logs` — log de avanço de etapas
- [ ] `acionamento_execucao` — dados de execução de campo
- [ ] `obras` — obras/contratos

#### Tabelas de Materiais
- [ ] `codigos_mao_de_obra` — catálogo de serviços
- [ ] `codigos_mo` — catálogo detalhado (com operação)
- [ ] `materiais` — catálogo de materiais
- [ ] `pre_lista_itens` — pré-lista de materiais
- [ ] `sucata_itens` — itens de sucata/devolução
- [ ] `lista_aplicacao_cabecalho` — cabeçalho de lista de aplicação
- [ ] `lista_aplicacao_itens` — itens da lista de aplicação

#### Tabelas de Medição
- [ ] `medicao_orcamentos` — orçamentos/medições
- [ ] `medicao_retorno_items` — itens de retorno de medição
- [ ] `medicao_aprovacao_logs` — log de aprovação de medição

#### Tabelas de Sistema
- [ ] `system_settings` — configurações globais (5 registros pré-carregados)
- [ ] `invites` — convites por email
- [ ] `notificacoes` — notificações do sistema
- [ ] `parametros_upr` — parâmetros UPS/UPR

### 7.2 Verificar RLS

Vá em **Authentication → Policies** e confirme que cada tabela tem RLS habilitado com policies adequadas.

### 7.3 Verificar Functions

Execute no SQL Editor:

```sql
-- Listar todas as funções customizadas
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

Deve retornar:
| routine_name | routine_type |
|---|---|
| avancar_etapa_acionamento | FUNCTION |
| fn_set_etapa_acionamento | FUNCTION |
| handle_new_user | FUNCTION |
| handle_updated_at | FUNCTION |
| has_role | FUNCTION |
| is_admin | FUNCTION |
| log_user_role_changes | FUNCTION |
| set_medicao_orcamentos_updated_at | FUNCTION |

### 7.4 Verificar Triggers

```sql
-- Listar todos os triggers
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

### 7.5 Verificar Dados Iniciais

```sql
-- Níveis de acesso (5 registros)
SELECT * FROM acesso_nivel;

-- System settings (5+ registros)
SELECT * FROM system_settings;
```

---

## 8. Passo 6 — Seed Data (Dados de Demonstração)

O arquivo `supabase/seeds/demo-data.sql` contém dados de demonstração para testes.

### Aplicar seed data (OPCIONAL — apenas para ambientes de teste)

```bash
supabase db seed
```

Ou copie o conteúdo de `supabase/seeds/demo-data.sql` no SQL Editor.

**O seed cria:**
- 1 usuário demo
- 30 acionamentos de exemplo (com diferentes status e etapas)
- 10 obras demo (representando os 10 estágios do workflow)

> ⚠️ **Não aplique seed data em produção**. Use apenas em ambientes de teste/staging.

---

## 9. Passo 7 — Configurar Autenticação

### 9.1 Configurações Gerais

No Dashboard: **Authentication → Configuration → General**

- **Site URL**: `https://obras.engeletrica.net`
- **Redirect URLs**: Adicione:
  - `https://obras.engeletrica.net`
  - `https://obras.engeletrica.net/*`
  - `https://obras.engeletrica.net/auth/callback`
  - `http://localhost:5173` (para desenvolvimento local)
  - `http://localhost:5173/*`

### 9.2 Email Provider

No Dashboard: **Authentication → Configuration → Email**

Configure as opções:

| Opção | Valor Recomendado |
|-------|-------------------|
| **Enable Email Signup** | ✅ ON |
| **Confirm email** | ✅ ON (para produção) ou ❌ OFF (para teste) |
| **Secure email change** | ✅ ON |
| **Double confirm changes** | ❌ OFF |
| **Minimum password length** | 8 |

### 9.3 Email Templates (Opcional)

No Dashboard: **Authentication → Email Templates**

Customize os templates de verificação, convite e reset de senha para português se desejado.

### 9.4 Criar o Primeiro Usuário Admin

**Opção A — Via Dashboard:**

1. Vá em **Authentication → Users**
2. Clique em **"Add User → Create New User"**
3. Preencha:
   - Email: seu email
   - Password: senha forte (8+ chars)
   - ✅ Auto Confirm User
4. Após criar, copie o **User UID** gerado
5. No **SQL Editor**, atribua o role ADMIN:

```sql
INSERT INTO user_roles (id, user_id, role)
VALUES (
  gen_random_uuid(),
  'COLE-O-USER-UID-AQUI',
  'ADMIN'
);
```

**Opção B — Via SQL apenas:**

```sql
-- 1. Primeiro crie o user via Dashboard (Authentication → Add User)
-- 2. Depois, no SQL Editor, encontre o user:
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- 3. Atribua o role ADMIN
INSERT INTO user_roles (id, user_id, role)
VALUES (gen_random_uuid(), 'user-id-aqui', 'ADMIN');
```

> **Nota importante**: O trigger `handle_new_user()` automaticamente cria um registro em `profiles` quando um novo usuário se registra no Supabase Auth. Então, assim que o usuário é criado (via signup ou dashboard), o profile é criado automaticamente.

---

## 10. Passo 8 — Deploy das Edge Functions

As Edge Functions são funções serverless escritas em Deno que rodam na infraestrutura do Supabase.

### 10.1 Deploy da função `send-invite-email`

```bash
supabase functions deploy send-invite-email --project-ref czpiltatsbhebdwyazap
```

### 10.2 Deploy da função `send-notification-email`

```bash
supabase functions deploy send-notification-email --project-ref czpiltatsbhebdwyazap
```

### 10.3 Verificar o deploy

```bash
supabase functions list --project-ref czpiltatsbhebdwyazap
```

Ou no Dashboard: **Edge Functions** — deve listar ambas as funções com status "Active".

### 10.4 O que cada função faz

| Função | Endpoint | Propósito |
|--------|----------|-----------|
| `send-invite-email` | `POST /functions/v1/send-invite-email` | Envia email de convite com link de cadastro para novos usuários. Recebe `{ email, token, roles[] }` |
| `send-notification-email` | `POST /functions/v1/send-notification-email` | Envia email de notificação (urgente/atrasado/alerta/info). Recebe `{ to, subject, tipo, titulo, mensagem, etapa? }` |

### 10.5 Testar uma Edge Function

```bash
curl -X POST \
  https://czpiltatsbhebdwyazap.supabase.co/functions/v1/send-notification-email \
  -H "Authorization: Bearer SUA_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "seu-email@exemplo.com",
    "subject": "Teste",
    "tipo": "info",
    "titulo": "Teste de Notificação",
    "mensagem": "Se você recebeu este email, a Edge Function está funcionando!"
  }'
```

---

## 11. Passo 9 — Configurar Secrets das Edge Functions

As Edge Functions precisam de variáveis de ambiente (secrets) para funcionar.

### 11.1 Obter API Key do Resend

1. Acesse [resend.com](https://resend.com) e crie uma conta
2. Vá em **API Keys** → **Create API Key**
3. Nome: `supabase-obras`
4. Permissão: `Sending access`
5. Domínio: All domains (ou configure um domínio próprio)
6. Copie a chave gerada (formato: `re_xxxxxxxxxxxx`)

### 11.2 Configurar o Secret no Supabase

**Via CLI:**
```bash
supabase secrets set RESEND_API_KEY=re_sua_chave_aqui --project-ref czpiltatsbhebdwyazap
```

**Via Dashboard:**
1. Vá em **Edge Functions → Manage Secrets**
2. Clique em **"Add Secret"**
3. Nome: `RESEND_API_KEY`
4. Valor: `re_sua_chave_aqui`
5. Salve

### 11.3 Variáveis automáticas

Estas variáveis são **automaticamente disponíveis** em todas as Edge Functions (não precisa configurar):
- `SUPABASE_URL` — URL do projeto
- `SUPABASE_ANON_KEY` — chave anon
- `SUPABASE_SERVICE_ROLE_KEY` — chave service role

### 11.4 Nota sobre domínio de envio de emails

A função `send-invite-email` usa `onboarding@resend.dev` como remetente (domínio de teste do Resend). Para produção:

1. No Resend, vá em **Domains** → **Add Domain**
2. Adicione seu domínio (ex: `engeletrica.net`)
3. Configure os registros DNS (SPF, DKIM, DMARC) conforme instruções do Resend
4. Após verificação, atualize o `from` nas Edge Functions para usar seu domínio

---

## 12. Passo 10 — Obter as Chaves do Projeto

### Via Dashboard

1. Vá em **Settings → API**
2. Copie:

| Chave | Campo no Dashboard | Uso |
|-------|-------------------|-----|
| **Project URL** | Project URL | `VITE_SUPABASE_URL` |
| **anon public** | Project API keys → anon public | `VITE_SUPABASE_PUBLISHABLE_KEY` |
| **service_role** | Project API keys → service_role | Apenas para scripts server-side (NUNCA no frontend) |

### Via CLI

```bash
supabase status --project-ref czpiltatsbhebdwyazap
```

> ⚠️ **IMPORTANTE**: A **anon key** é uma chave pública e pode ser exposta no frontend. A segurança é garantida pela **Row Level Security (RLS)** no banco. A **service_role key** JAMAIS deve ser exposta no frontend — ela bypassa todas as RLS policies.

---

## 13. Passo 11 — Configurar Variáveis de Ambiente

### Para Desenvolvimento Local

Edite o arquivo `.env` na raiz do projeto:

```dotenv
VITE_SUPABASE_URL=https://czpiltatsbhebdwyazap.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx  # sua anon key
VITE_DATA_SOURCE=supabase
```

### Para Build de Produção (Docker)

No `docker-compose.yml`, as variáveis são passadas como **build args**:

```yaml
services:
  frontend:
    build:
      context: .
      args:
        VITE_SUPABASE_URL: https://czpiltatsbhebdwyazap.supabase.co
        VITE_SUPABASE_PUBLISHABLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx"
        VITE_DATA_SOURCE: supabase
```

> **Por que build args?** As variáveis `VITE_*` são substituídas em tempo de **build** pelo Vite (não em runtime). Elas ficam embutidas no JavaScript final. Por isso a anon key é pública por design.

---

## 14. Passo 12 — Testar a Conexão

### Teste rápido via Node.js

Crie um arquivo `test-supabase.mjs` temporário:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://czpiltatsbhebdwyazap.supabase.co',
  'SUA_ANON_KEY_AQUI'
);

// Testar leitura
const { data: settings, error: settingsErr } = await supabase
  .from('system_settings')
  .select('*');

if (settingsErr) {
  console.error('❌ Erro ao ler system_settings:', settingsErr.message);
} else {
  console.log('✅ system_settings:', settings.length, 'registros');
}

// Testar leitura de equipes
const { data: equipes, error: equipesErr } = await supabase
  .from('equipes')
  .select('*');

if (equipesErr) {
  console.error('❌ Erro ao ler equipes:', equipesErr.message);
} else {
  console.log('✅ equipes:', equipes.length, 'registros');
}

// Testar auth
const { data: { session }, error: authErr } = await supabase.auth.getSession();
console.log('✅ Auth status:', session ? 'session active' : 'no active session');
console.log('\n🎉 Conexão com Supabase funcionando!');
```

```bash
node test-supabase.mjs
```

### Teste via Frontend

1. Inicie o dev server: `npm run dev`
2. Acesse `http://localhost:5173`
3. Verifique no Console do navegador se há erros de conexão com Supabase
4. Tente fazer login com o usuário admin criado

---

## 15. Referência Completa — Schema do Banco

### Tabelas Detalhadas

#### `usuarios`
| Coluna | Tipo | Constraints |
|--------|------|-------------|
| id_usuario | UUID PK | DEFAULT gen_random_uuid() |
| nome | TEXT | NOT NULL |
| cpf | TEXT | UNIQUE NOT NULL |
| email_empresa | TEXT | UNIQUE |
| ativo | TEXT | DEFAULT 'S', CHECK ('S','N') |
| telefone | TEXT | |
| observacao | TEXT | |
| pode_alterar_acionamento | BOOLEAN | DEFAULT false |
| criado_em | TIMESTAMPTZ | DEFAULT now() |
| atualizado_em | TIMESTAMPTZ | DEFAULT now() |

#### `equipes`
| Coluna | Tipo | Constraints |
|--------|------|-------------|
| id_equipe | UUID PK | DEFAULT gen_random_uuid() |
| nome_equipe | TEXT | NOT NULL |
| id_encarregado | UUID | FK → usuarios |
| ativo | TEXT | DEFAULT 'S' |
| encarregado_nome | TEXT | |
| encarregado_telefone | TEXT | |
| linha | TEXT | |
| criado_em | TIMESTAMPTZ | DEFAULT now() |
| atualizado_em | TIMESTAMPTZ | DEFAULT now() |

#### `acionamentos` (tabela principal do sistema)
| Coluna | Tipo | Nota |
|--------|------|------|
| id_acionamento | UUID PK | |
| origem | TEXT | |
| codigo_acionamento | TEXT | |
| numero_os | TEXT | |
| modalidade | TEXT | CHECK (LM, LV, LM+LV) |
| prioridade | TEXT | |
| prioridade_nivel | TEXT | normal/media/alta/emergencia |
| status | TEXT | CHECK (aberto, despachado, em_execucao, concluido, cancelado, pendente, em_andamento, programado) |
| etapa_atual | INTEGER | 1-10 (auto-computed by trigger) |
| encarregado | TEXT | |
| elemento_id | TEXT | |
| tipo_atividade | TEXT | |
| observacao | TEXT | |
| email_msg | TEXT | |
| *11 etapa timestamps* | TIMESTAMPTZ | etapa_1_despacho_em through etapa_10_finalizacao_em |
| *7 control timestamps* | TIMESTAMPTZ | pre_lista_validada_em, lista_aplicacao_validada_em, etc. |
| almox_conferido_em | TIMESTAMPTZ | |
| id_equipe | UUID | FK → equipes |
| id_viatura | UUID | FK → viaturas |
| id_responsavel | UUID | FK → usuarios |
| nf_numero | TEXT | |
| assinatura_cliente | TEXT | |
| criado_em, atualizado_em | TIMESTAMPTZ | |

#### `medicao_orcamentos`
| Coluna | Tipo | Nota |
|--------|------|------|
| id | UUID PK | |
| id_acionamento | UUID | UNIQUE, FK → acionamentos |
| itens_lm | JSONB | DEFAULT '[]' |
| itens_lv | JSONB | DEFAULT '[]' |
| fora_horario | BOOLEAN | DEFAULT false |
| valor_ups_lm | DECIMAL(12,2) | DEFAULT 0 |
| valor_ups_lv | DECIMAL(12,2) | DEFAULT 0 |
| total_base_lm | DECIMAL(12,2) | DEFAULT 0 |
| total_base_lv | DECIMAL(12,2) | DEFAULT 0 |
| total_final_lm | DECIMAL(12,2) | DEFAULT 0 |
| total_final_lv | DECIMAL(12,2) | DEFAULT 0 |
| criado_por | UUID | FK → auth.users |

---

## 16. Referência Completa — RLS Policies

### Políticas por tabela

| Tabela | Tipo | Acesso |
|--------|------|--------|
| usuarios | ALL | Authenticated |
| acesso_nivel | SELECT | Authenticated |
| usuario_acesso | SELECT | Authenticated |
| equipes | ALL | Authenticated |
| viaturas | ALL | Authenticated |
| parametros_upr | ALL | Authenticated |
| codigos_mao_de_obra | ALL | Authenticated |
| materiais | ALL | Authenticated |
| acionamentos | ALL | Authenticated |
| acionamento_eventos | ALL | Authenticated |
| acionamento_equipes | SELECT + ALL | Authenticated |
| acionamento_execucao | SELECT/INSERT/UPDATE/DELETE | Authenticated |
| obras | ALL | Authenticated |
| lista_aplicacao_cabecalho | ALL | Authenticated |
| lista_aplicacao_itens | ALL | Authenticated |
| pre_lista_itens | ALL | Authenticated |
| sucata_itens | ALL | Authenticated |
| medicao_orcamentos | SELECT/INSERT/UPDATE/DELETE | Authenticated |
| medicao_retorno_items | — | (policies not in migrations, may need adding) |
| profiles | SELECT: all; UPDATE: own; INSERT/DELETE: admin | Via `is_admin()` |
| user_roles | SELECT: all; ALL: admin | Via `is_admin()` |
| system_settings | SELECT: all; UPDATE: admin | Via `is_admin()` |
| invites | ALL: admin; SELECT: public | For token verification |
| notificacoes | SELECT: own or null; INSERT: auth; UPDATE: own | Per-user isolation |
| codigos_mo | SELECT: all; ALL: admin | Via `is_admin()` |
| user_roles_history | SELECT + INSERT | Open |

> **Modelo de segurança**: A maioria das tabelas operacionais é aberta para qualquer usuário autenticado. Controle fino é aplicado apenas em tabelas sensíveis (profiles, roles, settings, invites).

---

## 17. Referência Completa — Functions & Triggers

### `has_role(user_id UUID, role app_role)` → BOOLEAN
Verifica se o usuário possui determinado role.
```sql
SELECT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = $1
    AND user_roles.role = $2
)
```

### `is_admin(user_id UUID)` → BOOLEAN
Verifica se o usuário é ADMIN ou ADM.
```sql
SELECT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_roles.user_id = $1
    AND user_roles.role IN ('ADMIN', 'ADM')
)
```

### `handle_new_user()` → TRIGGER
Dispara em `AFTER INSERT ON auth.users`. Cria automaticamente um registro em `profiles` com os dados do novo usuário (nome, email extraídos de `raw_user_meta_data`).

### `fn_set_etapa_acionamento()` → TRIGGER
Dispara em `BEFORE INSERT OR UPDATE ON acionamentos`. Calcula automaticamente `etapa_atual` (1-10) baseado em quais timestamps de etapa estão preenchidos.

### `avancar_etapa_acionamento(id_acionamento UUID, direcao TEXT, motivo TEXT)` → VOID
Função chamável para avançar/retroceder etapas manualmente. Registra a transição na tabela `acionamento_etapa_logs`.

### `log_user_role_changes()` → TRIGGER
Dispara em `AFTER INSERT OR DELETE ON user_roles`. Registra mudanças de roles na tabela `user_roles_history`.

---

## 18. Troubleshooting

### Problema: "relation does not exist" ao fazer query

**Causa**: As migrations não foram aplicadas ou falharam parcialmente.

**Solução**:
```bash
supabase migration list --project-ref czpiltatsbhebdwyazap
```
Verifique quais migrations estão como `applied` e quais estão `pending`.

### Problema: "new row violates row-level security policy"

**Causa**: O usuário não tem permissão via RLS.

**Solução**: Verifique se o usuário está autenticado (o token JWT está sendo enviado). A maioria das policies exige `auth.role() = 'authenticated'`.

### Problema: Edge Function retorna 500

**Causa comum**: Secret `RESEND_API_KEY` não configurada.

**Solução**:
```bash
supabase secrets list --project-ref czpiltatsbhebdwyazap
```
Confirme que `RESEND_API_KEY` está listada.

### Problema: Trigger `handle_new_user` não cria profile

**Causa**: O trigger existe em `auth.users` que é schema protegido.

**Solução**: No SQL Editor, verifique:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Problema: Migration falha com "table already exists"

**Causa**: O banco já tinha as tabelas (setup manual anterior).

**Solução**: Use `IF NOT EXISTS` ou marque a migration como aplicada:
```bash
supabase migration repair 20251124190552 --status applied
```

### Problema: `supabase db push` pede senha e falha

**Causa**: Senha do banco incorreta.

**Solução**: Vá em **Dashboard → Settings → Database → Reset Database Password** para resetar a senha, depois tente novamente.

---

## Checklist Final de Deploy

- [ ] Projeto Supabase criado/acessível
- [ ] Supabase CLI instalado e logado
- [ ] Projeto linkado (`supabase link`)
- [ ] Migration SQLite removida/corrigida
- [ ] Migrations aplicadas (`supabase db push`)
- [ ] Tabelas verificadas no Dashboard (23+ tabelas)
- [ ] RLS habilitado em todas as tabelas
- [ ] Functions e Triggers criados (8 functions, 6 triggers)
- [ ] Auth configurado (Site URL, Redirect URLs)
- [ ] Primeiro usuário ADMIN criado
- [ ] User role ADMIN atribuído via SQL
- [ ] Edge Functions deployed (2 funções)
- [ ] Secret `RESEND_API_KEY` configurada
- [ ] Anon Key copiada para `.env` / `docker-compose.yml`
- [ ] Teste de conexão bem-sucedido
- [ ] Frontend consegue fazer login e carregar dados

---

## Resumo dos Comandos (Quick Reference)

```bash
# 1. Instalar CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Linkar projeto
supabase link --project-ref czpiltatsbhebdwyazap

# 4. Remover migration SQLite problemática
del supabase\migrations\20260122_create_acionamento_equipes.sql

# 5. Aplicar migrations
supabase db push

# 6. Deploy edge functions
supabase functions deploy send-invite-email --project-ref czpiltatsbhebdwyazap
supabase functions deploy send-notification-email --project-ref czpiltatsbhebdwyazap

# 7. Configurar secrets
supabase secrets set RESEND_API_KEY=re_xxx --project-ref czpiltatsbhebdwyazap

# 8. Verificar status
supabase migration list
supabase functions list
supabase secrets list
```
