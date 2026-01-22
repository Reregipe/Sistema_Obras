import Fastify from 'fastify';
import health from './routes/health.js';
import usuarios from './routes/usuarios.js';
import equipes from './routes/equipes.js';
import acionamentos from './routes/acionamentos.js';

const fastify = Fastify({ logger: true });

fastify.register(health);
fastify.register(usuarios);
fastify.register(equipes);
fastify.register(acionamentos);

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
