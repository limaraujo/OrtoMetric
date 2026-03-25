# Backend (Flask)

## Stack

- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- Pydantic

## Estrutura

```text
+api/
+  app.py
+  extensions/
+    db.py
+  models/
+    user.py
+  schemas/
+    user_schema.py
+  services/
+    exceptions.py
+    user_service.py
+  routes/
+    auth.py
+  tests/
+    test_auth.py
+```

## Responsabilidades por camada

- `routes/`: entrada HTTP e resposta
- `schemas/`: validacao de payload
- `services/`: regra de negocio
- `models/`: entidades persistidas
- `extensions/`: objetos compartilhados (db)

## Fluxo de autenticacao

1. `POST /auth/register`
2. `UserCreate` valida payload
3. `create_user` verifica email e cria usuario
4. Senha e hash com `generate_password_hash`
5. `POST /auth/login` valida credenciais
6. `login_user` gera JWT
7. `GET /auth/me` exige token (`@jwt_required`)

## Configuracao (app.py)

- CORS por `FRONTEND_ORIGINS`
- JWT secret exigido em producao
- Logging configurado por `LOG_LEVEL`
- Banco padrao: SQLite (`sqlite:///app.db`)

## Excecoes de dominio

Arquivo: `services/exceptions.py`

- `UserAlreadyExistsError`
- `InvalidCredentialsError`

Uso: evitar `ValueError` generico para regras de auth.

## Testes

Arquivo: `tests/test_auth.py`

Cobertura atual principal:
- cadastro
- login
- rota protegida
- login invalido

## Melhorias recomendadas

1. adicionar migrations (Alembic)
2. adicionar rate limit no login
3. adicionar refresh token
4. mover config para modulo dedicado
5. usar PostgreSQL em producao
