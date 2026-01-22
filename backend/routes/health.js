export default async function (fastify, opts) {
  fastify.get('/health', async (request, reply) => {
    try {
      return {
        success: true,
        data: { status: 'ok' },
        error: null
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: 'Erro ao verificar saúde do serviço.'
      };
    }
  });
}
