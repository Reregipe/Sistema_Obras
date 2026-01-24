-- Tabela auxiliar para vincular equipes a acionamentos
CREATE TABLE IF NOT EXISTS acionamento_equipes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_acionamento INTEGER NOT NULL,
    id_equipe TEXT NOT NULL,
    encarregado_nome TEXT,
    linha TEXT,
    FOREIGN KEY (id_acionamento) REFERENCES acionamentos(id)
);

-- Index para facilitar consultas
CREATE INDEX IF NOT EXISTS idx_acionamento_equipes_acionamento ON acionamento_equipes(id_acionamento);
CREATE INDEX IF NOT EXISTS idx_acionamento_equipes_equipe ON acionamento_equipes(id_equipe);