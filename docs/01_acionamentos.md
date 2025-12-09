# Fluxo de Acionamentos (10 Etapas)

## Resumo
Fluxo unico de trabalho com 10 etapas, do recebimento ate emissao de NF. Cada etapa exibe total, urgentes/atrasados e botao "Ver detalhes".

## Etapas (coluna vertebral)
1) Acionamentos recebidos  
   - Entrada do chamado; origem, prioridade, modalidade, local, fotos/anexos, equipe/viatura, datas (abertura, despacho, chegada, conclusao), historico obrigatorio.
2) Acionamentos executados  
   - Servico em execucao ou despachado; status executado.
3) Medir servicos executados  
   - Apontar MO/materiais, horarios; base para UPR/orcamento.
4) Criar OS no sistema  
   - OS formal com dados e evidencias; vinculo ao acionamento.
5) Enviar Book / Aguardando Obra  
   - Book com fotos/relatorios; aguarda obra ou proxima etapa.
6) Aprovacao Fiscal  
   - Checklist de conformidade; pendencias fiscais.
7) Obra criada (TCI)  
   - Emissao do TCI, pendencias tratadas; status da obra (quando aplicavel).
8) Aprovacao da medicao  
   - Gestor aprova medicao para faturamento.
9) Geracao de lote  
   - Agrupa obras/servicos aprovados por ciclo/lote.
10) Emissao de NF  
    - NF para concessionaria; fechamento financeiro.

## Detalhamento das etapas 1 e 2 (materiais + execucao)

### Etapa 01 – Pré-lista (Modal Lista de Materiais)
- Botão “Lista de Materiais” abre modal da pré-lista.
- Ações: buscar material por código/descrição, sistema carrega descrição/unidade, informar quantidade, adicionar, remover antes de salvar.
- Resultado: grava em `pre_lista_itens` vinculando apenas por `id_acionamento`. Nenhum ajuste ou sucata aqui.
- PDF: gera lista para envio com a equipe (seleção do encarregado antes de exportar).

### Etapa 02 – Ajuste pós-execução (Modal Lista de Materiais)
Abre três blocos (no mesmo modal do botão “Lista de Materiais”):
1) Pré-lista (referência, readonly)
2) Material aplicado (consumo real)  
   - Carrega pré-lista como base editável: código, descrição, unidade, quantidade (editável).  
   - Pode aumentar/diminuir/remover itens e incluir novos via busca.  
   - Salva em `lista_aplicacao_itens`.
3) Materiais retirados (sucata)  
   - Busca por código; sistema preenche descrição/unidade.  
   - Informa quantidade e classificação obrigatória (sucata/reforma/bom/descarte).  
   - Salva em `sucata_itens`.
- Regras: salvar consumo e sucata, registrar data/hora do ajuste. Etapa 2 só avança após listas salvas + medição executada.

### Etapa 02 – Dados da Execução (botão “Editar acionamento”)
- Modal “Dados da Execução do Acionamento”, editável só na Etapa 2.
- Campos obrigatórios apurados:  
  - KM inicial/final/total (total calculado).  
  - Datas/horas: saída da base, início do serviço, retorno do serviço, retorno à base.  
  - Pergunta: “Houve troca de transformador?”  
    - Se “Sim”: Transformador retirado/instalado (potência, marca, ano, tensões secundária/primária, número de série, patrimônio) e bloco de tensões (A-N, B-N, C-N, A-B, B-C, C-A).  
  - Identificação: Alimentador, Subestação, Nº do transformador, ID do poste.  
  - Dados administrativos: OS tablet, SS (Nota), Nº da intervenção.  
  - Observações gerais.
- Ao salvar: valida obrigatórios/condicionais e grava via API pelo `id_acionamento`. Ao entrar na Etapa 3 o modal fica bloqueado.

## Dados chave por etapa
- Acionamento: origem, prioridade, modalidade, endereco, fotos, equipe, viatura, datas, historico.
- OS: numero/ID, vinculada ao acionamento, datas, responsavel, evidencias.
- Book/Relatorios: fotos, observacoes, anexos, responsavel envio.
- Fiscal: conformidade, pendencias, data aprovacao.
- TCI/Obra: numero TCI, pendencias, status.
- Medicao: itens (MO/material), quantidades, valores UPR, data aprovacao gestor.
- Lote: ciclo, lote, itens, datas geracao/envio.
- NF: numero, data, valor, status (enviado/aprovado/pago).

## Indicadores
- Por etapa: total, urgentes, atrasados, concluidos.
- Por equipe/viatura: atendimentos, tempo medio, urgentes atendidos.
- Faturamento: valor por ciclo/lote, tempo de aprovacao fiscal/gestor.
- Medicao: previsto x faturado, retrabalho (itens ajustados).

## Regras de negocio
- Historico obrigatorio em alteracoes de status.
- Datas de despacho/chegada/conclusao registradas.
- Medicao so avanca apos aprovacao fiscal/gestor.
- Lote/NF dependem de medicao aprovada.
- Roles e RLS: ADMIN/ADM/GESTOR controlam aprovacoes; OPER executa/aponta.

## Pendencias/validacao
- Confirmar detalhamento final de status e nomenclaturas (linha viva/morta, modalidades, status NF/lote).
- Revisar RLS para ambiente de producao.
