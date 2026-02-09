import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../db/app.db');
const db = new Database(dbPath);

// Remove a coluna status da tabela materiais
try {
  db.prepare('ALTER TABLE materiais DROP COLUMN status').run();
  console.log('Coluna status removida com sucesso!');
} catch (err) {
  console.error('Erro ao remover coluna status:', err.message);
}
db.close();
