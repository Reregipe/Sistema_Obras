import Fastify from "fastify";
import cors from '@fastify/cors';
import health from "./routes/health.js";
import usuarios from "./routes/usuarios.js";
import equipes from "./routes/equipes.js";
import acionamentos from "./routes/acionamentos.js";
import acionamentoEquipes from "./routes/acionamento_equipes.js";
import codigosMO from "./routes/codigos_mo.js";

const fastify = Fastify({ logger: true });

// Habilita CORS para permitir acesso do frontend
await fastify.register(cors, {
  origin: ["http://localhost:8080", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
});

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

fastify.register(codigosMO);

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
