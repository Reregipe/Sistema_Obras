-- Corrige duplicação da função avancar_etapa_acionamento
-- Data: 2025-12-11

DROP FUNCTION IF EXISTS public.avancar_etapa_acionamento(uuid);
DROP FUNCTION IF EXISTS public.avancar_etapa_acionamento(uuid, text);
DROP FUNCTION IF EXISTS public.avancar_etapa_acionamento(uuid, text, text);

CREATE OR REPLACE FUNCTION public.avancar_etapa_acionamento(
    p_id_acionamento uuid,
    p_direcao text DEFAULT 'forward',
    p_update_step text DEFAULT 'false'
) RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    v_row public.acionamentos%rowtype;
    v_nova_etapa int;
    v_motivo text;
BEGIN
    SELECT * INTO v_row FROM public.acionamentos WHERE id_acionamento = p_id_acionamento;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    v_nova_etapa := NULL;
    v_motivo := COALESCE(NULLIF(p_update_step, ''), 'auto');

    IF COALESCE(LOWER(p_direcao), 'forward') = 'backward' THEN
        IF v_row.etapa_atual > 1 THEN
            v_nova_etapa := v_row.etapa_atual - 1;
            v_motivo := COALESCE(v_motivo, 'manual_backward');
        ELSE
            RETURN;
        END IF;
    ELSE
        IF v_row.etapa_atual = 1 AND v_row.pre_lista_validada_em IS NOT NULL THEN
            v_nova_etapa := 2;
            v_motivo := COALESCE(v_motivo, 'auto_1_to_2');
        ELSIF v_row.etapa_atual = 2 AND v_row.materiais_consumidos_em IS NOT NULL AND v_row.sucatas_enviadas_em IS NOT NULL THEN
            v_nova_etapa := 3;
            v_motivo := COALESCE(v_motivo, 'auto_2_to_3');
        ELSIF v_row.etapa_atual = 3 AND v_row.execucao_finalizada_em IS NOT NULL THEN
            v_nova_etapa := 4;
            v_motivo := COALESCE(v_motivo, 'auto_3_to_4');
        ELSIF v_row.etapa_atual = 4 AND v_row.assinatura_lider_equipe_em IS NOT NULL THEN
            v_nova_etapa := 5;
            v_motivo := COALESCE(v_motivo, 'auto_4_to_5');
        ELSIF v_row.etapa_atual = 5 AND v_row.assinatura_fiscal_em IS NOT NULL THEN
            v_nova_etapa := 6;
            v_motivo := COALESCE(v_motivo, 'auto_5_to_6');
        ELSIF v_row.etapa_atual = 6 AND v_row.assinatura_cliente_em IS NOT NULL THEN
            v_nova_etapa := 7;
            v_motivo := COALESCE(v_motivo, 'auto_6_to_7');
        ELSIF v_row.etapa_atual = 7 AND v_row.medicao_aprovada_em IS NOT NULL THEN
            v_nova_etapa := 8;
            v_motivo := COALESCE(v_motivo, 'auto_7_to_8');
        ELSIF v_row.etapa_atual = 8 AND v_row.lote_gerado_em IS NOT NULL THEN
            v_nova_etapa := 9;
            v_motivo := COALESCE(v_motivo, 'auto_8_to_9');
        ELSIF v_row.etapa_atual = 9 AND (v_row.nf_emitida_em IS NOT NULL OR v_row.nf_numero IS NOT NULL) THEN
            v_nova_etapa := 10;
            v_motivo := COALESCE(v_motivo, 'auto_9_to_10');
        END IF;
    END IF;

    IF v_nova_etapa IS NULL OR v_nova_etapa = v_row.etapa_atual THEN
        RETURN;
    END IF;

    IF COALESCE(LOWER(p_update_step), 'true') <> 'false' THEN
                UPDATE public.acionamentos
                     SET etapa_atual = v_nova_etapa
                 WHERE id_acionamento = p_id_acionamento;
    END IF;

    INSERT INTO public.acionamento_etapa_logs(id_acionamento, etapa_anterior, etapa_nova, motivo, criado_em)
    VALUES (p_id_acionamento, v_row.etapa_atual, v_nova_etapa, v_motivo, NOW());
END;
$$;
