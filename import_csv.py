import sqlite3
import csv
from pathlib import Path

DB_PATH = Path("backend/db/app.db")
CSV_DIR = Path("docs/tabelas")

conn = sqlite3.connect(DB_PATH)
cur = conn.cursor()

def table_columns(table_name):
    cur.execute(f"PRAGMA table_info({table_name})")
    return [row[1] for row in cur.fetchall()]

for csv_file in CSV_DIR.glob("*.csv"):
    table_name = csv_file.stem

    print(f"\nImportando tabela: {table_name}")

    columns_db = table_columns(table_name)

    with csv_file.open(encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

        if not rows:
            print("  -> CSV vazio, pulando.")
            continue

        valid_columns = [c for c in reader.fieldnames if c in columns_db]

        placeholders = ",".join("?" for _ in valid_columns)
        columns_sql = ",".join(valid_columns)

        sql = f"INSERT OR IGNORE INTO {table_name} ({columns_sql}) VALUES ({placeholders})"

        data = [
            [row[col] if row[col] != "" else None for col in valid_columns]
            for row in rows
        ]

        cur.executemany(sql, data)
        conn.commit()

        print(f"  -> {len(data)} registros importados.")

conn.close()
print("\nImportação finalizada.")
