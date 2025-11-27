# Obras (trilho separado) - rascunho inicial

## Visao geral
- Obras sao planejadas, longo prazo, ja nascem com numero de obra.
- Nao derivam de OS; carteira pode ser importada/definida com antecedencia.
- Relacao com acionamentos/OS e opcional (apenas se quiser cruzar dados de execucao emergencial).

## Campos sugeridos (ajustar)
- numero_obra (obrigatorio)
- escopo/descricao
- datas: inicio_prev, fim_prev, inicio_real, fim_real
- status: planejada, em_execucao, pausada, concluida, cancelada
- equipe/encarregado
- local: endereco, alimentador, subestacao
- TCI: numero, status, data_emissao
- aprovacao_gestor: status, data, observacao
- orcamento_previsto, valor_faturado (opcional para KPI)

## Status (propor)
- planejada
- em_execucao
- pausada
- concluida
- cancelada

## Pendencias/decisoes
- Confirmar se OS emergencial pode ser vinculada a obra (opcional).
- Definir campos finais e KPI para produtividade por obra.
- Revisar permissao/RLS especifica para edicao de obra.
