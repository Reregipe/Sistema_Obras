import sqlite3
from pathlib import Path

# caminhos
db_path = Path("backend/db/app.db")
schema_path = Path("backend/db/schema.sql")

# garante que a pasta existe
db_path.parent.mkdir(parents=True, exist_ok=True)

# lê o schema
with schema_path.open("r", encoding="utf-8") as f:
    schema_sql = f.read()

# cria conexão
conn = sqlite3.connect(db_path)

# executa o schema
conn.executescript(schema_sql)

# fecha conexão
conn.commit()
conn.close()

print("Banco SQLite criado com sucesso.")
