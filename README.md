# Totem de Check-in — PostgreSQL

Projeto completo de Totem de Check-in usando Node.js, Express e PostgreSQL.

## Segurança implementada

- SQL parametrizado com `$1`, evitando concatenação de entrada no SQL.
- Validação do CPF no Back-End.
- **Mascaramento do CPF** nas respostas da API.
- Senhas armazenadas como hash com `bcrypt`.
- JWT em cookie `httpOnly`.
- Controle de acesso por papel: `admin` e `operador`.
- Rate limiting por totem.
- Gestão centralizada de erros.
- Limite de tamanho do JSON recebido.
- Privilégio mínimo no PostgreSQL.
- Logs de tentativas de login sem registrar senha ou hash.

> Crie o `.env` localmente. Ele não deve ser enviado ao GitHub.

## Estrutura

```text
totem-checkin-sql/
├── db/
│   └── pool.js
├── middleware/
│   ├── auth.js
│   ├── errorHandler.js
│   └── rateLimiter.js
├── private/
│   ├── admin.html
│   └── index.html
├── public/
│   └── login.html
├── routes/
│   ├── admin.js
│   ├── auth.js
│   └── checkin.js
├── sql/
│   ├── schema.sql
│   ├── usuarios.sql
│   └── privilegios.sql
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── server.js
└── README.md
```

## 1. Banco

Crie o banco:

```sql
CREATE DATABASE totem_checkin;
```

Depois conecte-se ao banco e execute:

```text
sql/schema.sql
sql/usuarios.sql
```

Se estiver usando o usuário restrito da aplicação, configure também:

```text
sql/privilegios.sql
```

## 2. Configurar o ambiente

No Windows:

```bash
copy .env.example .env
```

Depois abra `.env` e configure:

```env
PORT=3000
DATABASE_URL=postgresql://totem_app:SUA_SENHA@localhost:5432/totem_checkin
JWT_SECRET=UMA_CHAVE_LONGA_E_ALEATORIA
NODE_ENV=development
```

## 3. Instalar

Dentro da pasta do projeto:

```bash
npm install
```

## 4. Executar

```bash
npm start
```

Abra:

```text
http://localhost:3000
```

## 5. Contas de teste

As contas estão em `sql/usuarios.sql`.

Exemplo:

```text
admin
senha: admin123
```

```text
operador
senha: operador123
```

Troque essas senhas antes de usar o sistema em ambiente real.

## 6. Mascaramento do CPF

O banco mantém o CPF completo para permitir a busca.

Porém, o Back-End não devolve o CPF completo para o Front-End.

Exemplo:

```text
Banco:
10466735480

API:
104.***.***-80
```

O mascaramento acontece em:

```text
routes/checkin.js
routes/admin.js
```

Não é necessário alterar a coluna `cpf` do banco para implementar o mascaramento.

## 7. Login

Falhas de login são registradas no terminal, por exemplo:

```text
[LOGIN INVÁLIDO] {
  timestamp: '...',
  usuario: 'admin',
  motivo: 'senha incorreta',
  ip: '::1'
}
```

A senha nunca é registrada no terminal.

Um login correto aparece como:

```text
[LOGIN OK] {
  timestamp: '...',
  usuario: 'admin',
  papel: 'admin',
  ip: '::1'
}
```

## 8. Testes do check-in

### CPF inválido

```bash
curl -i -X POST http://localhost:3000/checkin ^
-H "Content-Type: application/json" ^
-H "X-Totem-Id: totem-demo" ^
-d "{\"cpf\":\"abc\"}"
```

### CPF inexistente

```bash
curl -i -X POST http://localhost:3000/checkin ^
-H "Content-Type: application/json" ^
-H "X-Totem-Id: totem-demo" ^
-d "{\"cpf\":\"00000000000\"}"
```

### Check-in válido

```bash
curl -i -X POST http://localhost:3000/checkin ^
-H "Content-Type: application/json" ^
-H "X-Totem-Id: totem-demo" ^
-d "{\"cpf\":\"10466735480\"}"
```

A resposta contém os dados do candidato, mas o CPF vem mascarado.

### Check-in duplicado

Faça novamente o teste válido com o mesmo CPF.

O servidor retorna HTTP `409`.

### Rate limit

O projeto permite 3 tentativas por minuto por identificador de totem.

Na quarta tentativa dentro da janela, retorna HTTP `429`.

## 9. Saúde do servidor

A rota:

```text
GET /health
```

verifica a conexão com o PostgreSQL.

Exemplo:

```text
http://localhost:3000/health
```

## 10. Observação sobre produção

O rate limiter atual utiliza memória do processo. Em uma arquitetura com vários servidores/instâncias, use um armazenamento compartilhado, como Redis, para que o limite seja global.

Também é recomendado usar HTTPS em produção e configurar corretamente o `secure` do cookie.
