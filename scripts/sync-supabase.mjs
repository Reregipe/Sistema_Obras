import { fileURLToPath } from "node:url";
import path from "node:path";

import Database from "better-sqlite3";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const SUPABASE_URL =
  process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.SUPABASE_KEY ??
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Faltando variáveis de ambiente para conectar ao Supabase. Defina SUPABASE_URL + SUPABASE_KEY ou VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY."
  );
  process.exit(1);
}

const tablesToSync = process.argv.slice(2).filter(Boolean);
if (!tablesToSync.length) tablesToSync.push("codigos_mao_de_obra");

const dbPath = path.resolve(__dirname, "..", "supabase-local.db");
const db = new Database(dbPath);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sanitizeIdentifier = (value) => value.replace(/"/g, '""');
const serializeValue = (value) => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (typeof value === "object") return JSON.stringify(value);
  return value;
};

for (const table of tablesToSync) {
  console.log(`Buscando dados da tabela "${table}"...`);
  const { data, error } = await supabase.from(table).select("*");
  if (error) {
    console.error(`Falha ao ler ${table}:`, error.message);
    continue;
  }
  if (!data?.length) {
    console.log(`Nenhuma linha encontrada em ${table}; mantidas as entradas existentes.`);
    continue;
  }

  const columns = Array.from(
    new Set(data.flatMap((row) => Object.keys(row)))
  ).filter(Boolean);
  if (!columns.length) {
    console.warn(`Tabela ${table} não possui colunas válidas; pula.`);
    continue;
  }

  const quotedColumns = columns.map((column) => `"${sanitizeIdentifier(column)}"`);
  const tableName = `"${sanitizeIdentifier(table)}"`;

  db.exec(
    `CREATE TABLE IF NOT EXISTS ${tableName} (${quotedColumns
      .map((column) => `${column} TEXT`)
      .join(", ")})`
  );
  db.exec(`DELETE FROM ${tableName}`);

  const insert = db.prepare(
    `INSERT OR REPLACE INTO ${tableName} (${quotedColumns.join(
      ", "
    )}) VALUES (${columns.map(() => "?").join(", ")})`
  );

  let insertedRows = 0;
  const transaction = db.transaction((rows) => {
    for (const row of rows) {
      insert.run(columns.map((column) => serializeValue(row[column])));
      insertedRows += 1;
    }
  });
  transaction(data);

  console.log(
    `Sincronizado ${insertedRows} linhas da tabela ${table} para ${dbPath}.`
  );
}

db.close();
