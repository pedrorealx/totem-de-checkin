# Totem de Check-in — versão PostgreSQL

Projeto completo para a atividade do **Totem de Atendimento ao Consumidor**, com três pilares de segurança:

1. **Prevenção de SQL Injection** — validação de CPF + consultas PostgreSQL parametrizadas com `$1`.
2. **Gestão de erros no backend** — `errorHandler.js` centraliza erros de negócio, JSON inválido, indisponibilidade do banco e erros inesperados.
3. **Limite de requisições (Rate Limiting)** — cada totem pode fazer 3 tentativas por minuto; ao exceder, recebe HTTP 429 e bloqueio temporário.

Também há tratamento de falha de comunicação com o servidor no frontend e rota `/health` para verificar a conexão com o PostgreSQL.

## 1. Pré-requisitos

- Node.js instalado
- PostgreSQL instalado e em execução

## 2. Criar o banco

Crie um banco chamado `totem_checkin`:

```sql
CREATE DATABASE totem_checkin;
```

Depois conecte-se ao banco e execute todo o arquivo:

```text
sql/schema.sql
```

Esse script cria a tabela `candidatos` e cadastra **11 candidatos de teste**, incluindo:

```text
CPF: 10466735480
Nome: Pedro Henrique
Sala: Sala 01
```

## 3. Configurar a conexão

Copie `.env.example` para `.env` e ajuste a senha/usuário:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/totem_checkin
```

## 4. Instalar e iniciar

```bash
npm install
npm start
```

Abra:

```text
http://localhost:3000
```

No totem, digite `10466735480`.

## 5. Testes para apresentação

### CPF inválido — 400

```bash
curl -i -X POST http://localhost:3000/checkin -H "Content-Type: application/json" -H "X-Totem-Id: totem-demo" -d '{"cpf":"abc"}'
```

### CPF inexistente — 404

```bash
curl -i -X POST http://localhost:3000/checkin -H "Content-Type: application/json" -H "X-Totem-Id: totem-demo" -d '{"cpf":"00000000000"}'
```

### SQL Injection — deve falhar na validação

```bash
curl -i -X POST http://localhost:3000/checkin -H "Content-Type: application/json" -H "X-Totem-Id: totem-demo" -d '{"cpf":"'' OR ''1''=''1"}'
```

O código não concatena o CPF no SQL. Mesmo entradas que passassem pela validação seriam enviadas como parâmetro do `pg`.

### Check-in válido — 200

```bash
curl -i -X POST http://localhost:3000/checkin -H "Content-Type: application/json" -H "X-Totem-Id: totem-demo" -d '{"cpf":"10466735480"}'
```

### Check-in duplicado — 409

Execute o teste válido novamente para o mesmo CPF.

### Muitas requisições — 429

Faça 4 requisições usando o mesmo `X-Totem-Id` dentro de 1 minuto.

### Banco/servidor indisponível

Pare o PostgreSQL ou interrompa o servidor e teste novamente. O frontend mostra uma mensagem orientando o candidato a procurar um fiscal; o backend usa HTTP 503 para indisponibilidade do banco.

## Arquitetura

```text
Frontend (Totem)
       |
       v
POST /checkin
       |
       +--> Rate Limiter (Pilar 3)
       |
       +--> Validação do CPF (Pilar 1)
       |
       +--> PostgreSQL via pg + $1 (Pilar 1)
       |
       +--> Regra de negócio / atualização atômica
       |
       +--> Error Handler (Pilar 2)
```

## Observação sobre múltiplos totens

O rate limiter deste projeto usa memória do processo e identifica o totem por `X-Totem-Id`. Para vários servidores/instâncias em produção, o contador deve ser compartilhado (por exemplo, Redis), para que o limite seja realmente global.
