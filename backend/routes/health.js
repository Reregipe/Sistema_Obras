export default async function (fastify, opts) {
  fastify.get('/health', async (request, reply) => {
    return { status: 'ok' };
  });
}
