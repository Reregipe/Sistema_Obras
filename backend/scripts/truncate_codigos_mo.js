import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../db/app.db');
const db = new Database(dbPath);

db.prepare('DELETE FROM codigos_mao_de_obra').run();
db.prepare('VACUUM').run();

console.log('Tabela codigos_mao_de_obra limpa com sucesso.');
