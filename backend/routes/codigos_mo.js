import db from '../db/database.js';
import { success, fail } from '../utils/response.js';

export default async function (fastify, opts) {
  fastify.get('/codigosMO', async (request, reply) => {
    try {
      const rows = db.prepare('SELECT * FROM codigos_mao_de_obra').all();
      return success(rows);
    } catch (err) {
      return fail('Erro ao consultar códigos de mão de obra.');
    }
  });
}
