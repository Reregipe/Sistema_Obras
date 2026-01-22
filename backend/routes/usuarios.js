import db from '../db/database.js';

export default async function (fastify, opts) {
  fastify.get('/usuarios', async (request, reply) => {
    const rows = db.prepare('SELECT * FROM usuarios').all();
    return rows;
  });
}
