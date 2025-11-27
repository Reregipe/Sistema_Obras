# Documentacao Unificada do Sistema de Obras (v1.1)

## Status e abordagem
- Este arquivo e a referencia principal. Pode evoluir (versionar) conforme o projeto.
- Fluxo principal preservado: ACIONAMENTO (10 etapas) -> Medicao/Faturamento. Obras sao trilho separado (planejadas, numero proprio).
- Cadastros base (equipes, materiais, mao de obra, viaturas, codigos MO) servem a todos os fluxos.

## Estrutura de docs
- 00_documentacao_unificada_sistema_obras_v1.1.md (este arquivo)
- 01_acionamentos.md (fluxo detalhado em 10 etapas)
- 02_obras.md (trilho de obras planejadas; ainda a detalhar)
- 03_faturamento_produtividade.md (ciclo, lote, NF, KPI; a detalhar)
- 04_cadastros_base.md (equipes, materiais, mao de obra, viaturas, codigos MO)

## Visao geral
Sistema EngEletrica para gestao operacional e financeira:
- Acionamentos (trilha unica, 10 etapas)
- Obras (planejadas, longo prazo, numero de obra)
- Medicao/Listas de aplicacao -> Faturamento (ciclo/lote/NF)
- Cadastros base comuns
- Auditoria, roles, notificacoes, exports (PDF/Excel), Realtime

Tecnologia: React/TypeScript/Vite (frontend), Supabase (Postgres/Auth/RLS/Functions/Realtime), Resend (emails), jsPDF/XLSX (exports).

## Fluxo operacional
- Acionamento: 10 etapas (ver 01_acionamentos.md).
- Obras: trilho independente, nao nasce de OS; numero de obra predefinido (ver 02_obras.md).
- Medicao/Faturamento: recebe entradas de servicos realizados; gera ciclo/lote/NF (ver 03_faturamento_produtividade.md).
- Cadastros base: usados em todos os modulos (ver 04_cadastros_base.md).

## Regras chave atuais
- Historico/observacao obrigatoria em alteracoes de status de acionamento.
- Datas de despacho/chegada/conclusao registradas no fluxo de acionamento.
- Medicao so avanca com aprovacao fiscal/gestor.
- Lote/NF dependem de medicao aprovada.
- Roles principais: ADMIN/ADM/GESTOR/OPER/FIN. RLS a ser revisada para producao.

## Pendencias e pontos para validacao
- Definir detalhamento do trilho de Obras (status, campos definitivos, relacao opcional com acionamentos).
- Definir modelo de KPI de produtividade (por equipe, por obra, por ciclo).
- Revisar RLS e permissao fina por role para producao.
- Padronizar nomenclaturas (linha viva/morta, modalidades, status NF/lote).

## Processo de versao
- Nova versao? Copiar este arquivo para vX.Y, editar e registrar no CHANGELOG.
- Sempre referenciar a ultima versao em prompts para IA/Code Assistant.
