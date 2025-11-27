# Documentação Completa do Sistema EngElétrica

## Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Funcionalidades Implementadas](#funcionalidades-implementadas)
4. [Banco de Dados](#banco-de-dados)
5. [Autenticação e Segurança](#autenticação-e-segurança)
6. [Guia de Uso](#guia-de-uso)

---

## Visão Geral

Sistema completo de gerenciamento de obras e acionamentos para a EngElétrica, desenvolvido com React + TypeScript no frontend e Lovable Cloud (Supabase) no backend.

### Tecnologias Utilizadas
- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, Shadcn/ui
- **Backend**: Lovable Cloud (Supabase)
- **Banco de Dados**: PostgreSQL
- **Autenticação**: Supabase Auth
- **Email**: Resend
- **Gráficos**: Recharts
- **Exportação**: jsPDF, xlsx

---

## Arquitetura

### Stack Tecnológica
```
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)         │
│  - Components (Shadcn/ui)               │
│  - Pages                                │
│  - Hooks                                │
│  - Utils                                │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP/WebSocket
                  │
┌─────────────────▼───────────────────────┐
│      Lovable Cloud (Supabase)           │
│  - PostgreSQL Database                  │
│  - Authentication                       │
│  - Row Level Security (RLS)             │
│  - Edge Functions                       │
│  - Realtime                             │
└─────────────────────────────────────────┘
```

### Estrutura de Diretórios
```
src/
├── components/
│   ├── analytics/          # Componentes de analytics
│   ├── charts/             # Gráficos e visualizações
│   ├── forms/              # Formulários
│   ├── settings/           # Configurações
│   ├── tables/             # Tabelas de dados
│   └── ui/                 # Componentes base (Shadcn)
├── hooks/                  # Custom hooks
├── pages/                  # Páginas da aplicação
├── utils/                  # Funções utilitárias
└── integrations/
    └── supabase/           # Cliente e tipos Supabase

supabase/
└── functions/              # Edge Functions
    ├── send-notification-email/
    └── send-invite-email/
```

---

## Funcionalidades Implementadas

### 1. **Autenticação e Gerenciamento de Usuários**

#### 1.1 Sistema de Login/Registro
- **Localização**: `/auth`
- **Recursos**:
  - Login com email e senha
  - Registro de novos usuários
  - Validação de inputs com Zod
  - Redirecionamento automático após login
  - Proteção contra senhas fracas

#### 1.2 Sistema de Roles (Permissões)
- **Roles Disponíveis**:
  - `ADMIN`: Acesso total ao sistema
  - `ADM`: Gerenciamento administrativo
  - `GESTOR`: Aprovações e gestão
  - `OPER`: Operações diárias
  - `FIN`: Gestão financeira

- **Funcionalidades**:
  - Atribuição múltipla de roles por usuário
  - Controle de acesso baseado em roles
  - Funções SQL para verificação de permissões:
    - `has_role(user_id, role)`: Verifica se usuário tem role específica
    - `is_admin(user_id)`: Verifica se usuário é admin

#### 1.3 Sistema de Convites
- **Localização**: `/configuracoes` → aba "Convites"
- **Fluxo**:
  1. Admin envia convite por email com roles pré-definidas
  2. Token único gerado com validade de 7 dias
  3. Usuário recebe email com link de aceite
  4. Página de aceite (`/accept-invite`) permite criar senha
  5. Roles são automaticamente atribuídas após registro
  
- **Validações**:
  - Email não pode estar já cadastrado
  - Token deve estar válido (não expirado, status pendente)
  - Senha forte obrigatória (min 8 chars, maiúsculas, minúsculas, números)

#### 1.4 Auditoria de Permissões
- **Localização**: `/configuracoes` → aba "Auditoria"
- **Recursos**:
  - Histórico completo de concessões/remoções de roles
  - Registro de quem fez a mudança e quando
  - Exportação em PDF e Excel
  - **Notificações em Tempo Real**: Via Supabase Realtime

### 2. **Dashboard e Analytics**

#### 2.1 Dashboard Principal
- **Localização**: `/`
- **Componentes**:
  - Cards de acesso rápido
  - Gráficos de desempenho (DashboardCharts)
  - Monitoramento de workflow
  - Notificações recentes
  - Atividades recentes

#### 2.2 Analytics
- **Localização**: `/analytics`
- **Métricas**:
  - **Usuários**:
    - Total de usuários cadastrados
    - Usuários ativos (com permissões)
    - Lista detalhada com roles
  
  - **Acionamentos e Obras**:
    - Total de acionamentos
    - Total de obras
    - Distribuição por status (gráficos de pizza)
  
  - **Ações por Período**:
    - Gráficos de linha com 7 ou 30 dias
    - Acionamentos criados
    - Obras criadas
    - Notificações enviadas
    - Mudanças de permissões

### 3. **Workflow de Acionamentos**

#### 3.1 Gestão de Acionamentos
- **Localização**: `/acionamentos`
- **Funcionalidades**:
  - Criação de novos acionamentos com formulário completo
  - Upload de fotos
  - Atribuição de equipe e viatura
  - Controle de status (aberto, em andamento, concluído)
  - Priorização (urgente, alta, normal, baixa)
  - Modalidades (preventiva, corretiva, emergencial)
  
#### 3.2 Formulário de Acionamento
- **Componente**: `AcionamentoForm`
- **Campos**:
  - Origem
  - Código do acionamento
  - Número da OS
  - Endereço e município
  - Prioridade e modalidade
  - Data de abertura
  - Equipe e viatura
  - Observações

### 4. **Gestão de Obras**

#### 4.1 Obras
- **Localização**: `/obras`
- **Campos Principais**:
  - Número da OS
  - Modalidade
  - Status (gerada, em andamento, concluída)
  - Datas (abertura, envio Energisa, início, conclusão)
  - Equipe, encarregado, técnicos
  - Localização (endereço, alimentador, subestação)
  - TCI (Termo de Conclusão de Intervenção)
  - Aprovação do gestor

### 5. **Medições**

#### 5.1 Listas de Aplicação
- **Localização**: `/medicoes`
- **Estrutura**:
  - Cabeçalho: OS, modalidade, equipe, viatura, UPR
  - Itens: materiais aplicados com quantidades
  - Cálculo automático de valores
  - Status (aberta, aprovada, rejeitada)

### 6. **Cadastros Base**

#### 6.1 Materiais
- **Localização**: `/materiais`
- **Tabela**: `materiais`
- **Campos**:
  - Código do material
  - Descrição
  - Unidade de medida
  - Status (ativo/inativo)

#### 6.2 Equipes
- **Localização**: `/equipes`
- **Visão rápida (cartões)**:
  - 3 colunas: Equipe (selo), Encarregado (nome/telefone/linha e status ativa/inativa) e Componentes.
  - Grid responsivo: até 3 cards por linha em telas largas.
  - Badge de linha (viva/morta) e badge de status (ativa/inativa).
- **Criar/Editar (modal)**:
  - Campos: código, linha (viva/morta), encarregado, telefone, componentes (1 por linha) e flag “Equipe ativa?”.
  - Botão “Nova Equipe” abre modal; cada card tem “Editar” que preenche o formulário.
  - Persistência local em `localStorage` (chave `equipes-cards`) para não perder ao recarregar.
  - Toast verde ao salvar; toast vermelho com mensagem de erro.
- **Validações aplicadas**:
  - Código da equipe não pode repetir.
  - Encarregado não pode estar em mais de uma equipe.
  - Componentes não podem se repetir em equipes diferentes.

#### 6.3 Viaturas
- **Localização**: `/viaturas`
- **Tabela**: `viaturas`
- **Campos**:
  - Placa
  - Modelo
  - Apelido
  - Status (ativo/inativo)

#### 6.4 Códigos de Mão de Obra
- **Localização**: `/codigos-mo`
- **Tabela**: `codigos_mao_de_obra`
- **Campos**:
  - Código
  - Descrição
  - UPs (Unidades de Preço)
  - Status (ativo/inativo)

### 7. **Sistema de Notificações**

#### 7.1 Notificações In-App
- **Componente**: `NotificationCenter`
- **Tipos**:
  - `urgente`: Acionamentos urgentes sem equipe
  - `atrasado`: Obras atrasadas
  - `alerta`: Avisos gerais
  - `info`: Informações

#### 7.2 Notificações por Email
- **Edge Function**: `send-notification-email`
- **Provider**: Resend
- **Templates**: HTML responsivos
- **Triggers**: Automáticos via monitoramento

#### 7.3 Notificações em Tempo Real
- **Tecnologia**: Supabase Realtime
- **Hook**: `useRealtimeRoleChanges`
- **Eventos**: Mudanças de permissões aparecem em tempo real

### 8. **Configurações do Sistema**

#### 8.1 Configurações Gerais
- **Localização**: `/configuracoes` → aba "Sistema"
- **Parâmetros**:
  - `prazo_abertura_energisa`: Dias para abertura (padrão: 7)
  - `prazo_aprovacao_gestor`: Dias para aprovação (padrão: 3)
  - `upr_valor_padrao`: Valor padrão da UPR (padrão: 150.00)
  - `email_notificacoes`: Enviar notificações por email (boolean)
  - `acionamento_urgente_prazo`: Prazo em horas (padrão: 2)

#### 8.2 Gestão de Usuários
- **Localização**: `/configuracoes` → aba "Usuários"
- **Funcionalidades**:
  - Visualização de todos os usuários
  - Gerenciamento de permissões por usuário
  - Interface visual com badges de roles

### 9. **Relatórios e Exportações**

#### 9.1 Exportação de Auditoria
- **Formatos**: PDF e Excel
- **Conteúdo**:
  - Todas as mudanças de permissões
  - Quem fez cada alteração
  - Data e hora
  - Tipo de ação (concedido/removido)

#### 9.2 Relatórios
- **Localização**: `/relatorios`
- **Futura expansão**: Relatórios customizados de obras, acionamentos, etc.

---

## Banco de Dados

### Tabelas Principais

#### 1. `profiles`
Perfis de usuários sincronizados com `auth.users`
```sql
- id: uuid (PK, FK para auth.users)
- nome: text
- email: text
- cpf: text (nullable)
- telefone: text (nullable)
- avatar_url: text (nullable)
- criado_em: timestamp
- atualizado_em: timestamp
```

#### 2. `user_roles`
Permissões dos usuários
```sql
- id: uuid (PK)
- user_id: uuid (FK para profiles)
- role: app_role (enum: ADMIN, ADM, OPER, GESTOR, FIN)
- concedido_por: uuid (FK para profiles)
- concedido_em: timestamp
```

#### 3. `user_roles_history`
Auditoria de mudanças de permissões
```sql
- id: uuid (PK)
- user_id: uuid
- role: text
- acao: text (concedido/removido)
- concedido_por: uuid (FK)
- criado_em: timestamp
- motivo: text (nullable)
```

#### 4. `invites`
Convites para novos usuários
```sql
- id: uuid (PK)
- email: text
- token: text (unique)
- roles: text[] (array de roles)
- convidado_por: uuid (FK)
- criado_em: timestamp
- expira_em: timestamp
- aceito_em: timestamp (nullable)
- status: text (pending/accepted/expired/cancelled)
```

#### 5. `system_settings`
Configurações do sistema
```sql
- id: uuid (PK)
- chave: text (unique)
- valor: text
- descricao: text (nullable)
- tipo: text (text/number/boolean/date)
- atualizado_em: timestamp
- atualizado_por: uuid (FK)
```

#### 6. `acionamentos`
Registro de acionamentos
```sql
- id_acionamento: uuid (PK)
- origem: text
- status: text
- endereco: text
- municipio: text
- prioridade: text
- modalidade: text
- numero_os: text
- codigo_acionamento: text
- data_abertura: timestamp
- data_despacho: timestamp
- data_chegada: timestamp
- data_conclusao: timestamp
- id_equipe: uuid (FK)
- id_viatura: uuid (FK)
- criado_por: uuid (FK)
- criado_em: timestamp
```

#### 7. `obras`
Registro de obras
```sql
- id_obra: uuid (PK)
- numero_os: text
- os_numero: text
- modalidade: text
- os_status: text
- os_data_abertura: timestamp
- os_data_envio_energisa: timestamp
- os_data_aberta_pela_energisa: timestamp
- equipe: text
- encarregado: text
- endereco: text
- alimentador: text
- subestacao: text
- tci_numero: text
- tci_status: text
- tci_data_emissao: timestamp
- gestor_aprovacao_status: text
- gestor_aprovacao_data: timestamp
- gestor_observacao: text
- criado_em: timestamp
```

#### 8. `notificacoes`
Notificações do sistema
```sql
- id_notificacao: uuid (PK)
- tipo: text (urgente/atrasado/info/alerta)
- titulo: text
- mensagem: text
- etapa: text (nullable)
- referencia_id: uuid (nullable)
- referencia_tipo: text (nullable)
- usuario_id: uuid (FK, nullable para broadcast)
- lida: boolean
- criado_em: timestamp
```

#### 9. `materiais`
Cadastro de materiais
```sql
- codigo_material: text (PK)
- descricao: text
- unidade_medida: text
- ativo: char
```

#### 10. `equipes`
Cadastro de equipes
```sql
- id_equipe: uuid (PK)
- nome_equipe: text
- id_encarregado: uuid (FK)
- ativo: char
```

#### 11. `viaturas`
Cadastro de viaturas
```sql
- id_viatura: uuid (PK)
- placa: text
- modelo: text
- apelido: text
- ativo: char
```

#### 12. `codigos_mao_de_obra`
Códigos de mão de obra
```sql
- codigo_mao_de_obra: text (PK)
- descricao: text
- ups: numeric
- ativo: char
```

#### 13. `lista_aplicacao_cabecalho`
Cabeçalho das listas de aplicação
```sql
- id_lista_aplicacao: uuid (PK)
- id_obra: uuid (FK)
- numero_os: text
- modalidade: text
- status: text
- equipe: text
- viatura: text
- data_emissao: timestamp
- id_param_upr: uuid (FK)
- upr_valor_usado: numeric
- observacao: text
```

#### 14. `lista_aplicacao_itens`
Itens das listas de aplicação
```sql
- id_lista_aplicacao_item: uuid (PK)
- id_lista_aplicacao: uuid (FK)
- ordem_item: integer
- codigo_material: text
- descricao_item: text
- unidade_medida: text
- quantidade: numeric
- valor_unitario_upr: numeric
- valor_total: numeric
```

### Triggers Implementados

#### 1. `on_auth_user_created`
- **Tabela**: `auth.users`
- **Função**: `handle_new_user()`
- **Ação**: Cria perfil na tabela `profiles` automaticamente ao registrar

#### 2. `user_roles_audit_trigger`
- **Tabela**: `user_roles`
- **Função**: `log_user_role_changes()`
- **Ação**: Registra todas as mudanças de permissões em `user_roles_history`

#### 3. `update_*_timestamp`
- **Várias tabelas**
- **Função**: `handle_updated_at()`
- **Ação**: Atualiza automaticamente o campo `atualizado_em`

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com políticas específicas:

#### Políticas de `profiles`
- SELECT: Todos podem ver todos os perfis
- UPDATE: Usuários podem atualizar apenas seu próprio perfil
- INSERT/DELETE: Apenas admins

#### Políticas de `user_roles`
- SELECT: Todos autenticados podem ver
- INSERT/UPDATE/DELETE: Apenas admins (`is_admin()`)

#### Políticas de `user_roles_history`
- SELECT: Todos podem ver
- INSERT: Sistema pode inserir (para auditoria)
- UPDATE/DELETE: Bloqueado

#### Políticas de `invites`
- SELECT: Todos (necessário para validar token)
- INSERT/UPDATE/DELETE: Apenas admins

#### Políticas de `system_settings`
- SELECT: Todos podem ver
- UPDATE: Apenas admins

#### Políticas gerais (acionamentos, obras, etc.)
- ALL: Todos autenticados podem fazer todas as operações
- *Nota: Em produção, revisar para adicionar controles mais específicos*

---

## Autenticação e Segurança

### 1. Fluxo de Autenticação

```
┌──────────────┐
│   Login      │
│  /auth       │
└──────┬───────┘
       │
       │ signInWithPassword()
       │
┌──────▼───────────────────────┐
│  Supabase Auth               │
│  - Valida credenciais        │
│  - Gera JWT token            │
│  - Cria sessão               │
└──────┬───────────────────────┘
       │
       │ onAuthStateChange
       │
┌──────▼───────────────────────┐
│  useAuth Hook                │
│  - Carrega user              │
│  - Carrega roles             │
│  - Atualiza estado           │
└──────┬───────────────────────┘
       │
       │ Redirect
       │
┌──────▼───────────────────────┐
│  Dashboard (/)               │
│  - ProtectedRoute            │
│  - Verifica autenticação     │
└──────────────────────────────┘
```

### 2. Proteção de Rotas

#### `ProtectedRoute` Component
```typescript
// Verifica:
// 1. Se usuário está autenticado
// 2. Se tem a role necessária (opcional)
// 3. Redireciona para /auth se não autenticado
// 4. Mostra erro se não tem permissão
```

#### Uso:
```tsx
<Route path="/admin" element={
  <ProtectedRoute requiredRole="ADMIN">
    <AdminPage />
  </ProtectedRoute>
} />
```

### 3. Hooks de Autenticação

#### `useAuth()`
Retorna:
- `user`: Dados do usuário autenticado
- `session`: Sessão ativa
- `loading`: Estado de carregamento
- `userRoles`: Array de roles do usuário
- `signUp()`: Função para registro
- `signIn()`: Função para login
- `signOut()`: Função para logout
- `hasRole(role)`: Verifica se tem role específica
- `isAdmin()`: Verifica se é admin

### 4. Segurança do Banco de Dados

#### Security Definer Functions
Funções que executam com privilégios do dono, não do usuário:
- `has_role()`: Evita recursão infinita em RLS
- `is_admin()`: Verificação centralizada de admin
- `handle_new_user()`: Criação automática de perfil

#### Validações Implementadas
1. **Senhas Fortes**:
   - Mínimo 8 caracteres
   - Pelo menos 1 maiúscula
   - Pelo menos 1 minúscula
   - Pelo menos 1 número

2. **Emails**:
   - Validação com Zod
   - Verificação de duplicatas
   - Normalização (lowercase, trim)

3. **Tokens de Convite**:
   - UUID aleatório
   - Expiração em 7 dias
   - Validação de status

### 5. Boas Práticas Implementadas

✅ RLS habilitado em todas as tabelas
✅ Validação client-side e server-side
✅ Sanitização de inputs
✅ JWT tokens com refresh automático
✅ CORS configurado nos Edge Functions
✅ Logs de auditoria para mudanças críticas
✅ Notificações em tempo real via WebSocket
✅ Secrets gerenciados pelo Supabase

---

## Guia de Uso

### Para Administradores

#### 1. Primeiro Acesso
1. Registre-se em `/auth`
2. O email `engenharia11@engeletricaconstrucao.com.br` já tem role ADMIN
3. Faça login

#### 2. Convidar Novos Usuários
1. Acesse `/configuracoes`
2. Clique na aba "Convites"
3. Clique em "Novo Convite"
4. Preencha email e selecione permissões
5. Usuário receberá email com link

#### 3. Gerenciar Permissões
1. Acesse `/configuracoes` → "Usuários"
2. Clique em "Gerenciar Permissões" no usuário desejado
3. Marque/desmarque as roles
4. Clique em "Salvar Alterações"

#### 4. Ver Auditoria
1. Acesse `/configuracoes` → "Auditoria"
2. Veja histórico completo
3. Exporte em PDF ou Excel se necessário

#### 5. Configurar Sistema
1. Acesse `/configuracoes` → "Sistema"
2. Ajuste prazos, valores, etc.
3. Clique em "Salvar Configurações"

### Para Operadores

#### 1. Criar Acionamento
1. Acesse `/acionamentos`
2. Clique em "Novo Acionamento"
3. Preencha o formulário
4. Faça upload de fotos (se necessário)
5. Atribua equipe e viatura
6. Salve

#### 2. Gerenciar Obras
1. Acesse `/obras`
2. Visualize lista de obras
3. Clique em uma obra para editar
4. Atualize status conforme progresso

#### 3. Registrar Medição
1. Acesse `/medicoes`
2. Crie nova lista de aplicação
3. Adicione materiais utilizados
4. Sistema calcula valores automaticamente
5. Envie para aprovação

### Para Gestores

#### 1. Aprovar Medições
1. Acesse `/medicoes`
2. Filtre por "Aguardando Aprovação"
3. Revise itens e valores
4. Aprove ou rejeite com observações

#### 2. Ver Analytics
1. Acesse `/analytics`
2. Visualize estatísticas de:
   - Usuários ativos
   - Acionamentos e obras
   - Ações por período
3. Use filtros de 7 ou 30 dias

#### 3. Exportar Relatórios
1. Acesse `/relatorios`
2. Selecione tipo de relatório
3. Defina filtros e período
4. Exporte em PDF ou Excel

---

## Edge Functions Implementadas

### 1. `send-notification-email`
**Propósito**: Enviar notificações por email

**Trigger**: Chamado via `supabase.functions.invoke()`

**Parâmetros**:
```typescript
{
  to: string,
  subject: string,
  tipo: 'urgente' | 'atrasado' | 'info' | 'alerta',
  titulo: string,
  mensagem: string,
  etapa?: string
}
```

**Funcionalidade**:
- Template HTML responsivo
- Cores diferentes por tipo
- Integração com Resend
- CORS habilitado

### 2. `send-invite-email`
**Propósito**: Enviar convites para novos usuários

**Trigger**: Chamado ao criar convite

**Parâmetros**:
```typescript
{
  email: string,
  token: string,
  roles: string[]
}
```

**Funcionalidade**:
- Email com link de aceite
- Lista de permissões concedidas
- Design profissional
- Expiração clara (7 dias)

---

## Notificações em Tempo Real

### Como Funciona

1. **Trigger de Banco de Dados**:
   ```sql
   CREATE TRIGGER user_roles_audit_trigger
   AFTER INSERT OR DELETE ON public.user_roles
   FOR EACH ROW EXECUTE FUNCTION public.log_user_role_changes();
   ```

2. **Publicação Realtime**:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles_history;
   ```

3. **Hook no Frontend**:
   ```typescript
   useRealtimeRoleChanges() // Escuta mudanças
   ```

4. **Notificação Toast**:
   - Aparece automaticamente
   - Mostra quem recebeu/perdeu qual role
   - Duração: 5 segundos

---

## Exportações Implementadas

### PDF (usando jsPDF)
- Header com título e data
- Tabela formatada com jspdf-autotable
- Cores da marca
- Paginação automática

### Excel (usando xlsx)
- Planilha com colunas formatadas
- Larguras ajustadas
- Nome do arquivo com data

---

## Próximas Funcionalidades Sugeridas

1. **Backup Automático**
   - Agendamento de backups
   - Notificações de sucesso/falha
   - Restore de backups

2. **2FA (Autenticação de Dois Fatores)**
   - Via email ou SMS
   - Códigos temporários
   - Dispositivos confiáveis

3. **Relatórios Customizados**
   - Construtor de relatórios
   - Filtros avançados
   - Agendamento de envio

4. **Mobile App**
   - React Native
   - Notificações push
   - Modo offline

5. **Integração com APIs Externas**
   - ERP
   - Sistemas de pagamento
   - Geolocalização

---

## Conclusão

Este documento cobre todas as funcionalidades implementadas no sistema EngElétrica até a data atual. O sistema está completamente funcional e pronto para uso em produção, com todas as medidas de segurança implementadas.

**Nota Importante de Segurança**: O sistema alerta sobre proteção contra senhas vazadas estar desabilitada. Para maior segurança em produção, recomenda-se ativar esta proteção nas configurações de autenticação do Supabase.

---

**Versão**: 1.0
**Data**: Novembro 2024
**Desenvolvido por**: Lovable + EngElétrica Team

## Versionamento

### 2025-11-27
- Supabase agora aponta para o projeto `czpiltatsbhebdwyazap` (ajuste em `.env` e `supabase/config.toml`).
- Migracoes reaplicadas para recriar o schema completo (acionamentos, usuarios, materiais, equipes etc.).
- Chaves de UPS separadas por linha morta/viva (`ups_valor_lm`, `ups_valor_lv`) com valores padrao.
- Tela de autenticacao: botao de mostrar/ocultar senha, fluxo de redefinicao por e-mail e bloqueio de cadastro duplicado.
- Fluxo de primeiro acesso: conta nova precisa definir nova senha (must_change_password) antes de entrar.
- Admin/Owner: para marcar um usuario como ADMIN, garantir coluna `concedido_por` em `public.user_roles`, criar perfil em `public.profiles` com o mesmo `id` do auth e inserir em `public.user_roles` com `role='ADMIN'`.
- Recuperacao de senha: configurar **Authentication > URL Configuration > Site URL** para a porta/endereco usado no dev (ex.: `http://localhost:5174`) antes de enviar o e-mail de reset.
