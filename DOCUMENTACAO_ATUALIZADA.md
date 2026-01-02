
# Atualizações Recentes no Fluxo de Trabalho

## 1. KPIs Front-end
- Cards com os totais dos estágios Abertos, Despachados/Execução, Concluídos (medição) e Prontos para OS são renderizados diretamente a partir do estado das etapas no componente principal (sem dependências adicionais no banco).
- Os textos de detalhe são derivados dos status de cada etapa, garantindo que o indicador reflete o contexto atual.

## 2. Busca global nos modais
- Cada modal de etapa exibe um input fixo que filtra os cartões em tempo real pelo código do acionamento, município, modalidade ou número da obra.
- O filtro reaplica a lista conforme o texto muda, tornando mais rápido abrir dialogos com dezenas de itens.

## 3. Padronização das ações
- A função enderStepActions centraliza a renderização dos botões, garantindo layout consistente e fácil manutenção.
- Etapas 1 e 2 mantêm o mesmo conjunto (lista de materiais, dados de execução, editar) e etapas posteriores mostram apenas ações contextuais (Registrar OS, Medição/Orçamento, Auditoria, Lote, NF, etc.).
- O botão Editar foi removido de 3 a 10, mantendo o foco no trabalho da etapa.
