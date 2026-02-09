import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../db/app.db');
const db = new Database(dbPath);

db.prepare('DROP TABLE IF EXISTS codigos_mao_de_obra_old').run();
console.log('Tabela codigos_mao_de_obra_old excluída com sucesso.');
