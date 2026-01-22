import db from '../db/database.js';

export default async function (fastify, opts) {
  fastify.get('/acionamentos', async (request, reply) => {
    try {
      const rows = db.prepare('SELECT * FROM acionamentos').all();
      return {
        success: true,
        data: rows,
        error: null
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: 'Erro ao consultar acionamentos.'
      };
    }
  });
}
