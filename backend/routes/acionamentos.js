import db from '../db/database.js';
import { success, fail } from '../utils/response.js';

export default async function (fastify, opts) {
  fastify.get('/acionamentos', async (request, reply) => {
    try {
      const rows = db.prepare('SELECT * FROM acionamentos').all();
      return success(rows);
    } catch (err) {
      return fail('Erro ao consultar acionamentos.');
    }
  });
}
