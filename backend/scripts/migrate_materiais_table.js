import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../db/app.db');
const db = new Database(dbPath);

// Renomeia tabela antiga se existir
try {
  db.prepare('ALTER TABLE materiais RENAME TO materiais_old').run();
} catch {}

// Cria nova tabela materiais
// codigo é PRIMARY KEY (ajuste conforme necessário)
db.prepare(`CREATE TABLE IF NOT EXISTS materiais (
  codigo TEXT PRIMARY KEY,
  descricao TEXT,
  unidade TEXT,
  status TEXT
)`).run();

// Copia dados antigos se existirem
try {
  const rows = db.prepare('SELECT * FROM materiais_old').all();
  const insert = db.prepare('INSERT OR IGNORE INTO materiais (codigo, descricao, unidade, status) VALUES (?, ?, ?, ?)');
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(row.codigo, row.descricao, row.unidade, row.status);
    }
  });
  insertMany(rows);
  db.prepare('DROP TABLE IF EXISTS materiais_old').run();
  console.log('Tabela materiais migrada e dados antigos preservados.');
} catch {
  console.log('Tabela materiais criada. Nenhum dado antigo encontrado.');
}
