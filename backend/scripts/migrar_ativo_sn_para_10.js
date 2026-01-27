import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, './db/app.db');
const db = new Database(dbPath);

// Atualiza todos os materiais: 'S' => 1, 'N' => 0
const update = db.prepare("UPDATE materiais SET ativo = CASE WHEN ativo = 'S' THEN 1 WHEN ativo = 'N' THEN 0 ELSE ativo END");
const result = update.run();

console.log(`Registros atualizados: ${result.changes}`);
db.close();
