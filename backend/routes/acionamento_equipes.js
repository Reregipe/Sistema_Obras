import db from '../db/database.js';
import { success, fail } from '../utils/response.js';

export default async function (fastify, opts) {
  fastify.post('/acionamento_equipes', async (request, reply) => {
    try {
      const { id_acionamento, id_equipe } = request.body;
      if (!id_acionamento || !id_equipe) {
        return fail('id_acionamento e id_equipe são obrigatórios.');
      }
      const stmt = db.prepare('INSERT INTO acionamento_equipes (id_acionamento, id_equipe) VALUES (?, ?)');
      stmt.run(id_acionamento, id_equipe);
      return success({ id_acionamento, id_equipe });
    } catch (err) {
      return fail('Erro ao vincular equipe ao acionamento.');
    }
  });
}
