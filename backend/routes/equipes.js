import db from '../db/database.js';

export default async function (fastify, opts) {
  fastify.get('/equipes', async (request, reply) => {
    const rows = db.prepare('SELECT * FROM equipes').all();
    return rows;
  });
}
