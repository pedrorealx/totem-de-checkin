-- Privilégio mínimo para a aplicação.
-- Execute como administrador do PostgreSQL.
-- Troque a senha abaixo por uma senha forte e NÃO coloque esse valor no GitHub.

-- CREATE ROLE totem_app WITH LOGIN PASSWORD 'SUA_SENHA_FORTE';

GRANT CONNECT ON DATABASE totem_checkin TO totem_app;
GRANT USAGE ON SCHEMA public TO totem_app;

GRANT SELECT, INSERT, UPDATE ON TABLE public.candidatos TO totem_app;
GRANT USAGE, SELECT ON SEQUENCE public.candidatos_id_seq TO totem_app;

GRANT SELECT ON TABLE public.usuarios TO totem_app;

REVOKE CREATE ON SCHEMA public FROM totem_app;

-- Observação:
-- Se o role já existir, não execute novamente o CREATE ROLE.
