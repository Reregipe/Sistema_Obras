import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../db/app.db');
const db = new Database(dbPath);

// 1. Renomeia a tabela atual
try {
  db.prepare('ALTER TABLE codigos_mao_de_obra RENAME TO codigos_mao_de_obra_tmp').run();
} catch {}

// 2. Cria a nova tabela com codigo_mao_de_obra INTEGER

db.prepare(`CREATE TABLE codigos_mao_de_obra (
  codigo_mao_de_obra INTEGER NOT NULL,
  operacao TEXT NOT NULL,
  descricao TEXT,
  unidade TEXT,
  ups REAL,
  ativo TEXT,
  tipo TEXT NOT NULL,
  raw_line TEXT,
  created_at TEXT,
  PRIMARY KEY (codigo_mao_de_obra, operacao, tipo)
)`).run();

// 3. Copia os dados convertendo codigo_mao_de_obra para inteiro
const rows = db.prepare('SELECT * FROM codigos_mao_de_obra_tmp').all();
const insert = db.prepare(`INSERT INTO codigos_mao_de_obra 
  (codigo_mao_de_obra, operacao, descricao, unidade, ups, ativo, tipo, raw_line, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
const insertMany = db.transaction((rows) => {
  for (const row of rows) {
    insert.run(
      parseInt(row.codigo_mao_de_obra, 10),
      row.operacao,
      row.descricao,
      row.unidade,
      row.ups,
      row.ativo,
      row.tipo,
      row.raw_line,
      row.created_at
    );
  }
});
insertMany(rows);

db.prepare('DROP TABLE IF EXISTS codigos_mao_de_obra_tmp').run();
console.log('Tabela codigos_mao_de_obra migrada para INTEGER com sucesso.');
