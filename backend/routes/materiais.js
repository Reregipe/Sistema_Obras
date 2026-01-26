import Database from 'better-sqlite3';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function materiaisRoutes(fastify) {
  const dbPath = path.resolve(__dirname, '../db/app.db');
  const db = new Database(dbPath);

  fastify.get('/materiais', async (request, reply) => {
    try {
      const rows = db.prepare('SELECT * FROM materiais').all();
      // Mapeia os campos para os nomes esperados pelo frontend
      const mapped = rows.map(row => ({
        codigo_material: row.codigo,
        descricao: row.descricao,
        unidade_medida: row.unidade,
        ativo: row.status
      }));
      reply.send({ data: mapped });
    } catch (err) {
      reply.status(500).send({ error: 'Erro ao buscar materiais', details: err.message });
    }
  });
}
