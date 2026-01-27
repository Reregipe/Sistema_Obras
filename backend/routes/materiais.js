import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function materiaisRoutes(fastify) {
	const dbPath = path.resolve(__dirname, '../db/app.db');
	const db = new Database(dbPath);

	// Lista todos os materiais
	fastify.get('/materiais', async (request, reply) => {
		try {
			const rows = db.prepare('SELECT * FROM materiais').all();
			console.log('MATERIAIS DB:', rows);
			const mapped = rows.map(row => ({
				codigo_material: row.codigo,
				descricao: row.descricao,
				unidade_medida: row.unidade,
				status: Number(row.status)
			}));
			reply.send({ data: mapped });
		} catch (err) {
			reply.status(500).send({ error: 'Erro ao buscar materiais', details: err.message });
		}
	});

	// Atualiza o status (0/1) de um material
	fastify.put('/materiais/:codigo/status', async (request, reply) => {
		const { codigo } = request.params;
		const { status } = request.body;
		if (typeof status !== 'number' || ![0, 1].includes(status)) {
			return reply.status(400).send({ success: false, error: 'Valor de status inválido' });
		}
		try {
			const stmt = db.prepare('UPDATE materiais SET status = ? WHERE codigo = ?');
			const result = stmt.run(status, codigo);
			if (result.changes === 0) {
				return reply.status(404).send({ success: false, error: 'Material não encontrado' });
			}
			reply.send({ success: true });
		} catch (err) {
			reply.status(500).send({ success: false, error: 'Erro ao atualizar status', details: err.message });
		}
	});
}
