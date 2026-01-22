import { success, fail } from '../utils/response.js';

export default async function (fastify, opts) {
  fastify.get('/health', async (request, reply) => {
    try {
      return success({ status: 'ok' });
    } catch (err) {
      return fail('Erro ao verificar saúde do serviço.');
    }
  });
}
