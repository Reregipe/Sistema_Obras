import { supabase } from "@/integrations/supabase/client";

export const useNotifications = () => {
  const createNotification = async (
    tipo: 'urgente' | 'atrasado' | 'info' | 'alerta',
    titulo: string,
    mensagem: string,
    etapa?: string,
    referenciaId?: string,
    referenciaTipo?: string
  ) => {
    const { error } = await supabase
      .from('notificacoes')
      .insert({
        tipo,
        titulo,
        mensagem,
        etapa,
        referencia_id: referenciaId,
        referencia_tipo: referenciaTipo,
      });

    if (error) {
      console.error('Erro ao criar notificação:', error);
    }
  };

  const checkAcionamentosUrgentes = async () => {
    // Verificar acionamentos com prioridade emergencial sem equipe
    const { data: acionamentosUrgentes } = await supabase
      .from('acionamentos')
      .select('*')
      .eq('prioridade', 'emergencia')
      .eq('status', 'aberto')
      .is('id_equipe', null);

    if (acionamentosUrgentes && acionamentosUrgentes.length > 0) {
      await createNotification(
        'urgente',
        'Acionamentos urgentes sem equipe',
        `${acionamentosUrgentes.length} acionamento(s) de emergência aguardando atribuição de equipe`,
        'Etapa 1: Acionamentos recebidos'
      );
    }
  };

  const checkObrasAtrasadas = async () => {
    // Verificar obras que estão atrasadas
    const prazoLimite = new Date();
    prazoLimite.setDate(prazoLimite.getDate() - 7); // 7 dias de prazo

    const { data: obrasAtrasadas } = await supabase
      .from('obras')
      .select('*')
      .eq('os_status', 'enviada')
      .lt('os_data_envio_energisa', prazoLimite.toISOString())
      .is('os_data_aberta_pela_energisa', null);

    if (obrasAtrasadas && obrasAtrasadas.length > 0) {
      await createNotification(
        'atrasado',
        'Obras aguardando aprovação Energisa',
        `${obrasAtrasadas.length} obra(s) com prazo vencido para abertura pela Energisa`,
        'Etapa 6: Aprovação Fiscal'
      );
    }
  };

  const checkMedicoesGestor = async () => {
    // Verificar medições aguardando aprovação do gestor
    const { data: medicoesGestor } = await supabase
      .from('obras')
      .select('*')
      .eq('gestor_aprovacao_status', 'aguardando');

    if (medicoesGestor && medicoesGestor.length > 0) {
      await createNotification(
        'urgente',
        'Medições aguardando aprovação',
        `${medicoesGestor.length} medição(ões) aguardando aprovação do gestor`,
        'Etapa 8: Aprovação da medição'
      );
    }
  };

  const runMonitoring = async () => {
    await checkAcionamentosUrgentes();
    await checkObrasAtrasadas();
    await checkMedicoesGestor();
  };

  return {
    createNotification,
    runMonitoring,
  };
};
