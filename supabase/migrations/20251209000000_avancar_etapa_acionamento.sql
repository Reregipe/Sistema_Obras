-- Migration: Atualiza funcao de avanço de etapas dos acionamentos
-- Autor: [Seu Nome Aqui]
-- Data: 2025-12-09

create or replace function public.avancar_etapa_acionamento(
    p_id_acionamento uuid,
    p_direcao text default 'forward',
    p_update_step text default 'false'
) returns void
language plpgsql
as $$
declare
    v_row public.acionamentos%rowtype;
    v_nova_etapa int;
    v_motivo text;
begin
    select * into v_row from public.acionamentos where id = p_id_acionamento;
    if not found then
        return;
    end if;

    v_nova_etapa := null;
    v_motivo := coalesce(nullif(p_update_step, ''), 'auto');

    if coalesce(lower(p_direcao), 'forward') = 'backward' then
        if v_row.etapa_atual > 1 then
            v_nova_etapa := v_row.etapa_atual - 1;
            v_motivo := coalesce(v_motivo, 'manual_backward');
        else
            return;
        end if;
    else
        if v_row.etapa_atual = 1 and v_row.pre_lista_validada_em is not null then
            v_nova_etapa := 2;
            v_motivo := coalesce(v_motivo, 'auto_1_to_2');
        elsif v_row.etapa_atual = 2 and v_row.materiais_consumidos_em is not null and v_row.sucatas_enviadas_em is not null then
            v_nova_etapa := 3;
            v_motivo := coalesce(v_motivo, 'auto_2_to_3');
        elsif v_row.etapa_atual = 3 and v_row.execucao_finalizada_em is not null then
            v_nova_etapa := 4;
            v_motivo := coalesce(v_motivo, 'auto_3_to_4');
        elsif v_row.etapa_atual = 4 and v_row.assinatura_lider_equipe_em is not null then
            v_nova_etapa := 5;
            v_motivo := coalesce(v_motivo, 'auto_4_to_5');
        elsif v_row.etapa_atual = 5 and v_row.assinatura_fiscal_em is not null then
            v_nova_etapa := 6;
            v_motivo := coalesce(v_motivo, 'auto_5_to_6');
        elsif v_row.etapa_atual = 6 and v_row.assinatura_cliente_em is not null then
            v_nova_etapa := 7;
            v_motivo := coalesce(v_motivo, 'auto_6_to_7');
        elsif v_row.etapa_atual = 7 and v_row.medicao_aprovada_em is not null then
            v_nova_etapa := 8;
            v_motivo := coalesce(v_motivo, 'auto_7_to_8');
        elsif v_row.etapa_atual = 8 and v_row.lote_gerado_em is not null then
            v_nova_etapa := 9;
            v_motivo := coalesce(v_motivo, 'auto_8_to_9');
        elsif v_row.etapa_atual = 9 and (v_row.nf_emitida_em is not null or v_row.nf_numero is not null) then
            v_nova_etapa := 10;
            v_motivo := coalesce(v_motivo, 'auto_9_to_10');
        end if;
    end if;

    if v_nova_etapa is null or v_nova_etapa = v_row.etapa_atual then
        return;
    end if;

    if coalesce(lower(p_update_step), 'true') <> 'false' then
        update public.acionamentos
           set etapa_atual = v_nova_etapa
         where id = p_id_acionamento;
    end if;

    insert into public.acionamento_etapa_logs(id_acionamento, etapa_anterior, etapa_nova, motivo, criado_em)
    values (p_id_acionamento, v_row.etapa_atual, v_nova_etapa, v_motivo, now());
end;
$$;
