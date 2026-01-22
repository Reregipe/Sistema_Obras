import db from '../db/database.js';

export default async function (fastify, opts) {
  fastify.get('/acionamentos', async (request, reply) => {
    const rows = db.prepare('SELECT * FROM acionamentos').all();
    return rows;
  });
}
