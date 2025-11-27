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
