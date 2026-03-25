# API Reference

Base URL local: `http://localhost:5000`

## Health/Home

### GET /

Retorna mensagem simples de disponibilidade.

Resposta 200:

```json
{
  "message": "Welcome to the API!"
}
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

Regras de senha:
- minimo 8 caracteres
- 1 maiuscula
- 1 minuscula
- 1 numero
- 1 simbolo

Resposta 201:

```json
{
  "id": 1,
  "username": "usuario",
  "email": "user@example.com"
}
```

Erros:
- 400 validacao invalida
- 400 email ja existente
- 500 erro interno

### POST /auth/login

Autentica usuario e retorna JWT.

Body:

```json
{
  "email": "user@example.com",
  "password": "Senha@123"
}
```

Resposta 200:

```json
{
  "user": {
    "id": 1,
    "username": "usuario",
    "email": "user@example.com"
  },
  "access_token": "<jwt>"
}
```

Erros:
- 400 payload invalido
- 401 credenciais invalidas
- 500 erro interno

### GET /auth/me

Rota protegida.

Header:

```http
Authorization: Bearer <access_token>
```

Resposta 200:

```json
{
  "user_id": "1"
}
```

## Exemplo rapido com curl

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"dev","email":"dev@example.com","password":"Senha@123"}'

curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@example.com","password":"Senha@123"}'
```
