import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../db/app.db');
const xlsxPath = path.resolve(__dirname, '../../docs/tabelas/materiais.xlsx');
const db = new Database(dbPath);

function parseXLSX(filePath) {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: null });
  return data;
}

function main() {
  const rows = parseXLSX(xlsxPath);
  const insert = db.prepare(`INSERT OR REPLACE INTO materiais 
    (codigo, descricao, unidade, status) VALUES (?, ?, ?, ?)`);
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
  insertMany(rows);
  console.log(`Importados ${rows.length} materiais do Excel para o banco.`);
}

main();
