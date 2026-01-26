import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../db/app.db');
const csvPath = path.resolve(__dirname, '../../docs/tabelas/materiais.csv');
const db = new Database(dbPath);

function parseCSV(filePath) {
  const file = fs.readFileSync(filePath, 'utf8');
  const parsed = Papa.parse(file, { header: true, skipEmptyLines: true });
  return parsed.data;
}

function main() {
  const rows = parseCSV(csvPath);
  const insert = db.prepare(`INSERT OR REPLACE INTO materiais 
    (codigo, descricao, unidade, status) VALUES (?, ?, ?, ?)`);
  // Mapeia campos do CSV para os nomes do banco
  const mappedRows = rows.map(row => ({
    codigo: row.codigo_material,
    descricao: row.descricao,
    unidade: row.unidade_medida,
    status: row.ativo
  }));
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(
        row.codigo,
        row.descricao,
        row.unidade,
        row.status
      );
    }
  });
  insertMany(mappedRows);
  console.log(`Importados ${rows.length} materiais do CSV para o banco.`);
}

main();
