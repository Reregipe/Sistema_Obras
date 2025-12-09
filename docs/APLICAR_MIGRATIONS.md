# Como Aplicar as Migrations no Supabase

## Passo a Passo

1. **Acesse o Supabase Dashboard**
   - Vá para: https://supabase.com/dashboard
   - Entre no seu projeto

2. **Abra o SQL Editor**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New Query"

3. **Execute a Migration 1: Colunas de Controle**
   
   Copie e cole o conteúdo de:
   ```
   supabase/migrations/20251209000001_add_etapa_control_columns.sql
   ```
   
   Ou cole diretamente:
   ```sql
   -- Adiciona colunas de timestamp para controle de avanço de etapas
   alter table public.acionamentos
     add column if not exists pre_lista_validada_em timestamptz,
     add column if not exists materiais_consumidos_em timestamptz,
     add column if not exists sucatas_enviadas_em timestamptz,
     add column if not exists execucao_finalizada_em timestamptz,
     add column if not exists assinatura_lider_equipe_em timestamptz,
     add column if not exists assinatura_fiscal_em timestamptz,
     add column if not exists assinatura_cliente_em timestamptz;

   -- Comentários explicativos
   comment on column public.acionamentos.pre_lista_validada_em is 'Timestamp de validação da pré-lista (Etapa 1 → 2)';
   comment on column public.acionamentos.materiais_consumidos_em is 'Timestamp de registro de consumo de materiais (Etapa 2 → 3, junto com sucatas_enviadas_em)';
   comment on column public.acionamentos.sucatas_enviadas_em is 'Timestamp de registro de sucatas/descarte (Etapa 2 → 3, junto com materiais_consumidos_em)';
   comment on column public.acionamentos.execucao_finalizada_em is 'Timestamp de finalização da execução (Etapa 3 → 4)';
   comment on column public.acionamentos.assinatura_lider_equipe_em is 'Timestamp de assinatura do líder de equipe (Etapa 4 → 5)';
   comment on column public.acionamentos.assinatura_fiscal_em is 'Timestamp de assinatura do fiscal (Etapa 5 → 6)';
   comment on column public.acionamentos.assinatura_cliente_em is 'Timestamp de assinatura do cliente (Etapa 6 → 7)';
   ```
   
   Clique em "Run" (ou Ctrl+Enter)

4. **Execute a Migration 2: Função de Avanço Automático**
   
   Copie e cole o conteúdo de:
   ```
   supabase/migrations/20251209000000_avancar_etapa_acionamento.sql
   ```
   
   (É uma função SQL maior, copie o arquivo completo)
   
   Clique em "Run" (ou Ctrl+Enter)

5. **Verifique se deu certo**
   
   Execute esta query para verificar:
   ```sql
   -- Verifica se as colunas foram criadas
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'acionamentos' 
   AND column_name LIKE '%_em';
   
   -- Verifica se a função foi criada
   SELECT routine_name 
   FROM information_schema.routines 
   WHERE routine_name = 'avancar_etapa_acionamento';
   ```

## Depois de Aplicar

Após aplicar as migrations, o sistema vai:
- ✅ Atualizar o status automaticamente (aberto → despachado → em_execucao → concluido)
- ✅ Avançar etapas automaticamente quando os carimbos de tempo forem preenchidos
- ✅ Registrar logs de mudança de etapa na tabela `acionamento_etapa_logs`

## Troubleshooting

Se der erro dizendo que a coluna já existe, é porque você já aplicou antes. Tudo bem, só ignore o erro.

Se der erro de permissão, verifique se você está logado como owner do projeto no Supabase.
