import Fastify from "fastify";
import health from "./routes/health.js";
import usuarios from "./routes/usuarios.js";
import equipes from "./routes/equipes.js";
import acionamentos from "./routes/acionamentos.js";
import acionamentoEquipes from "./routes/acionamento_equipes.js";

const fastify = Fastify({ logger: true });

fastify.get("/", async () => {
  return {
    status: "ok",
    app: "Sistema Obras",
    backend: "Fastify + SQLite",
    time: new Date().toISOString()
  };
});

fastify.register(health);
fastify.register(usuarios);
fastify.register(equipes);
fastify.register(acionamentos);
fastify.register(acionamentoEquipes);

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
