import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../db/app.db');
const xlsxPath = path.resolve(__dirname, '../../docs/tabelas/mao_de_obra_2.xlsx');
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
  const insert = db.prepare(`INSERT OR REPLACE INTO codigos_mao_de_obra 
    (codigo_mao_de_obra, operacao, descricao, unidade, ups, ativo, tipo)
    VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(
        parseInt(row.codigo_mao_de_obra, 10),
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
  console.log(`Importados ${rows.length} códigos do Excel para o banco.`);
}

main();
