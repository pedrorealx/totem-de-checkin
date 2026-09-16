# Roteiro de Apresentação — Totem de Check-in sem PostgreSQL

## Antes de começar

1. Execute `npm install`.
2. Execute `npm start`.
3. Abra `http://localhost:3000`.
4. O CPF `10466735480` já está cadastrado em `data/candidatos.json`.

## Demonstração

Digite `10466735480` no teclado do totem e confirme. O sistema mostra nome, sala e horário.

Se tentar novamente, aparece `CHECKIN_DUPLICADO`.

## Onde estão os dados?

Os candidatos ficam em `data/candidatos.json`. Não existe mais conexão com PostgreSQL. Para trocar o CPF de teste, edite o campo `cpf` nesse arquivo.

## Segurança

- Validação de CPF: somente 11 dígitos.
- Não existe SQL nesta versão, portanto não há consulta SQL para explorar.
- Rate limiting continua limitando tentativas por totem.
- Erros continuam centralizados no `middleware/errorHandler.js`.

## Limitação

O JSON local é ótimo para demonstração e um totem isolado. Em um ambiente real com vários totens, o ideal é usar armazenamento compartilhado para evitar conflitos de dados.
