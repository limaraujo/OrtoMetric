# API

Base local: `http://localhost:5000`

## Health

### GET /

Retorna uma mensagem simples de disponibilidade.

Resposta:

```json
{ "message": "Welcome to the API!" }
```

## Auth

### POST /auth/register

Cria usuario.

Body:

```json
{
  "username": "usuario",
  "email": "user@example.com",
  "password": "Senha@123"
}
```

### POST /auth/login

Autentica usuario e devolve a informacao basica do perfil. Os tokens sao enviados em cookies.

### POST /auth/refresh

Renova o access token usando o refresh token.

### POST /auth/logout

Remove os cookies de sessao.

### GET /auth/me

Rota protegida para validar a sessao atual.

### GET /auth/profile

Retorna o perfil do usuario autenticado.

### PUT /auth/profile

Atualiza username e/ou email.

## Measurement types

### GET /measurement-types

Lista os tipos de medicao do usuario, incluindo padroes e customizacoes.

### PUT /measurement-types/sync

Sincroniza a lista completa de tipos de medicao.

### GET /measurement-types/active

Le o tipo de medicao ativo.

### PUT /measurement-types/active

Atualiza o tipo de medicao ativo.

## Exemplo rapido

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"dev","email":"dev@example.com","password":"Senha@123"}'
```
