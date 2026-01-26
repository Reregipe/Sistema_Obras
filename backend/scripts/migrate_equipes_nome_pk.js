import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../db/app.db');
const db = new Database(dbPath);

// 1. Renomeia a tabela antiga
try {
  db.prepare('ALTER TABLE equipes RENAME TO equipes_old').run();
} catch {}

// 2. Cria a nova tabela com nome_equipe como PRIMARY KEY

db.prepare(`CREATE TABLE equipes (
  nome_equipe TEXT PRIMARY KEY,
  ativo TEXT NOT NULL,
  encarregado_nome TEXT,
  encarregado_telefone TEXT,
  linha TEXT
)`).run();

// 3. Copia os dados, usando nome_equipe como chave
const rows = db.prepare('SELECT * FROM equipes_old').all();
const insert = db.prepare(`INSERT INTO equipes 
  (nome_equipe, ativo, encarregado_nome, encarregado_telefone, linha)
  VALUES (?, ?, ?, ?, ?)`);
const insertMany = db.transaction((rows) => {
  for (const row of rows) {
    insert.run(
      row.nome_equipe,
      row.ativo,
      row.encarregado_nome,
      row.encarregado_telefone,
      row.linha
    );
  }
});
insertMany(rows);

db.prepare('DROP TABLE IF EXISTS equipes_old').run();
console.log('Tabela equipes migrada: id_equipe removido, nome_equipe agora é PRIMARY KEY.');
