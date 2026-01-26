import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../db/app.db');
const db = new Database(dbPath);

// 1. Renomeia a tabela antiga (backup)
db.prepare('ALTER TABLE codigos_mao_de_obra RENAME TO codigos_mao_de_obra_old').run();

// 2. Cria a nova tabela com chave composta
db.prepare(`CREATE TABLE codigos_mao_de_obra (
  codigo_mao_de_obra TEXT NOT NULL,
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

console.log('Tabela codigos_mao_de_obra migrada com sucesso. Pronta para reimportação.');
