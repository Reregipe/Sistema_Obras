// Supabase removido

export const useNotifications = () => {
  const createNotification = async (
    tipo: 'urgente' | 'atrasado' | 'info' | 'alerta',
    titulo: string,
    mensagem: string,
    etapa?: string,
    referenciaId?: string,
    referenciaTipo?: string
  ) => {
    // Mock: apenas loga no console
    console.log('Notificação criada (mock):', { tipo, titulo, mensagem, etapa, referenciaId, referenciaTipo });
  };

  const checkAcionamentosUrgentes = async () => {
    // Mock: não faz nada
  };

  const checkObrasAtrasadas = async () => {
    // Mock: não faz nada
  };

  const checkMedicoesGestor = async () => {
    // Mock: não faz nada
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
