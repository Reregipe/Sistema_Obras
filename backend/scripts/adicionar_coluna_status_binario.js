import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, '../db/app.db');
const db = new Database(dbPath);

// Adiciona a coluna status como INTEGER binário (0 = Inativo, 1 = Ativo)
try {
  db.prepare('ALTER TABLE materiais ADD COLUMN status INTEGER NOT NULL DEFAULT 1').run();
  console.log('Coluna status criada com sucesso!');
} catch (err) {
  console.error('Erro ao criar coluna status:', err.message);
}
db.close();
