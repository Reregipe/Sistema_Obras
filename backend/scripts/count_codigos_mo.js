import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../db/app.db');
const db = new Database(dbPath);

const row = db.prepare('SELECT COUNT(*) as total FROM codigos_mao_de_obra').get();
console.log(`Total de registros em codigos_mao_de_obra: ${row.total}`);
