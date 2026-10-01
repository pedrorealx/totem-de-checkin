# Roteiro de Apresentação — Totem de Check-in PostgreSQL

## Antes de começar

1. Abra um terminal na pasta do projeto.
2. Execute `npm install`.
3. Configure o `.env`.
4. Crie o banco PostgreSQL.
5. Execute `sql/schema.sql`.
6. Execute `sql/usuarios.sql`.
7. Execute `npm start`.
8. Abra `http://localhost:3000`.

## Login

Use uma das contas de teste cadastradas em `sql/usuarios.sql`.

Após o login:

- `admin` acessa a consulta de candidatos.
- `operador` acessa o totem.

## Demonstração do check-in

Digite:

```text
10466735480
```

O sistema confirma a presença e mostra:

- nome;
- sala;
- horário da prova.

O CPF completo não é exibido pela API.

## Mascaramento

No banco:

```text
10466735480
```

Na resposta da API:

```text
104.***.***-80
```

Isso demonstra o princípio de mascaramento de dados sensíveis.

## Tentativa inválida

Digite menos ou mais de 11 números.

O Back-End rejeita a requisição.

## CPF inexistente

Use:

```text
00000000000
```

O sistema retorna que o candidato não foi encontrado.

## Check-in duplicado

Faça o check-in novamente para:

```text
10466735480
```

O sistema retorna HTTP 409 e informa que o check-in já foi realizado.

## Rate limiting

O projeto permite 3 tentativas por minuto por totem.

Na quarta tentativa:

```text
HTTP 429
```

O sistema informa o tempo restante do bloqueio.

## Login inválido no terminal

Digite uma senha incorreta.

No terminal aparecerá algo semelhante a:

```text
[LOGIN INVÁLIDO] {
  usuario: 'admin',
  motivo: 'senha incorreta',
  ...
}
```

A senha não aparece no log.

## Segurança

### Confidencialidade
- senha armazenada com bcrypt;
- JWT em cookie `httpOnly`;
- CPF mascarado nas respostas da API;
- erros técnicos não são enviados ao usuário.

### Integridade
- consultas parametrizadas;
- atualização do check-in feita no Back-End;
- atualização atômica evita confirmação duplicada simultânea.

### Disponibilidade
- rate limiting;
- timeout da conexão PostgreSQL;
- tratamento de indisponibilidade do banco;
- rota `/health`.

### Privilégio mínimo
O arquivo `sql/privilegios.sql` mostra como conceder somente os privilégios necessários ao usuário da aplicação.

## Encerramento

O fluxo apresentado é:

```text
Usuário
   ↓
Login
   ↓
JWT em cookie httpOnly
   ↓
Totem
   ↓
Validação do CPF
   ↓
Consulta parametrizada
   ↓
Regra de negócio
   ↓
Atualização atômica
   ↓
CPF mascarado na resposta
   ↓
Confirmação na tela
```
