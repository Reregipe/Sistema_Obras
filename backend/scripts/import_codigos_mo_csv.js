import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../db/app.db');
const csvPath = path.resolve(__dirname, '../../docs/tabelas/codigos_mao_de_obra.csv');
const db = new Database(dbPath);

function parseCSV(csv) {
  const parsed = Papa.parse(csv, { header: true, skipEmptyLines: true });
  return parsed.data;
}

function main() {
  const csv = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCSV(csv);
  const insert = db.prepare(`INSERT OR REPLACE INTO codigos_mao_de_obra 
    (codigo_mao_de_obra, operacao, descricao, unidade, ups, ativo, tipo)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(
        row.codigo_mao_de_obra,
        row.operacao,
        row.descricao,
        row.unidade,
        row.ups,
        row.ativo,
        row.tipo
      );
    }
  });
  insertMany(rows);
  console.log(`Importados ${rows.length} códigos para o banco.`);
}

main();
