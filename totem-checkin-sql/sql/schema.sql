-- Banco do Totem de Check-in
-- Execute no PostgreSQL antes de iniciar o servidor.

CREATE TABLE IF NOT EXISTS candidatos (
  id SERIAL PRIMARY KEY,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  nome VARCHAR(120) NOT NULL,
  sala VARCHAR(50) NOT NULL,
  horario_prova TIMESTAMPTZ NOT NULL,
  checkin_feito BOOLEAN NOT NULL DEFAULT FALSE,
  checkin_em TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_candidatos_cpf ON candidatos (cpf);

-- 11 candidatos de teste.
INSERT INTO candidatos (cpf, nome, sala, horario_prova, checkin_feito, checkin_em)
VALUES
('10466735480', 'Pedro Henrique', 'Sala 01', '2026-09-10T08:00:00-03:00', FALSE, NULL),
('12345678901', 'Ana Carolina', 'Sala 01', '2026-09-10T08:00:00-03:00', FALSE, NULL),
('98765432100', 'João Victor', 'Sala 02', '2026-09-10T08:30:00-03:00', FALSE, NULL),
('11122233344', 'Mariana Alves', 'Sala 02', '2026-09-10T08:30:00-03:00', FALSE, NULL),
('55566677788', 'Lucas Gabriel', 'Sala 03', '2026-09-10T09:00:00-03:00', FALSE, NULL),
('22233344455', 'Beatriz Souza', 'Sala 03', '2026-09-10T09:00:00-03:00', FALSE, NULL),
('66677788899', 'Rafael Santos', 'Sala 04', '2026-09-10T09:30:00-03:00', FALSE, NULL),
('33344455566', 'Juliana Oliveira', 'Sala 04', '2026-09-10T09:30:00-03:00', FALSE, NULL),
('77788899900', 'Gabriel Ferreira', 'Sala 05', '2026-09-10T10:00:00-03:00', FALSE, NULL),
('44455566677', 'Larissa Martins', 'Sala 05', '2026-09-10T10:00:00-03:00', FALSE, NULL),
('88899900011', 'Matheus Costa', 'Sala 06', '2026-09-10T10:30:00-03:00', FALSE, NULL)
ON CONFLICT (cpf) DO UPDATE SET
  nome = EXCLUDED.nome,
  sala = EXCLUDED.sala,
  horario_prova = EXCLUDED.horario_prova;
