import db from '../db/database.js';

export default async function (fastify, opts) {
  fastify.get('/equipes', async (request, reply) => {
    try {
      const rows = db.prepare('SELECT * FROM equipes').all();
      return {
        success: true,
        data: rows,
        error: null
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        error: 'Erro ao consultar equipes.'
      };
    }
  });
}
