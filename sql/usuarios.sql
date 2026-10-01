-- Tabela de usuários (login).
-- Execute no banco que o projeto está usando (via psql, pgAdmin, ou SQL Editor do seu provedor).

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  usuario VARCHAR(60) NOT NULL UNIQUE,
  senha_hash VARCHAR(120) NOT NULL,
  papel VARCHAR(20) NOT NULL CHECK (papel IN ('admin', 'operador')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Duas contas de exemplo já com a senha criptografada (bcrypt).
-- admin    -> senha: admin123
-- operador -> senha: operador123
-- TROQUE ESSAS SENHAS depois de testar.
INSERT INTO usuarios (usuario, senha_hash, papel) VALUES
('admin', '$2b$10$u0BfqV9/g.s0Sud/MTb/veAGx.n3w0jo1p.WMlIWz8hBp.a1RkQqm', 'admin'),
('operador', '$2b$10$QUort2T7TAwNHTM/UqmAkOsAwMdRoohCYDt64v4Ki1zmBoSYLtHzW', 'operador')
ON CONFLICT (usuario) DO NOTHING;

-- Se você já criou o usuário restrito "totem_app" (privilégio mínimo),
-- rode isso também para garantir que ele pode LER a tabela usuarios:
-- GRANT SELECT ON public.usuarios TO totem_app;
