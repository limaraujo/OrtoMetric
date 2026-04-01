# Backend

## Stack

- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- Flask-Limiter
- Pydantic

## Camadas

- `api/factory.py`: `create_app()` — monta Flask, configura extensoes (DB, JWT, CORS, limiter), registra blueprints e cabecalhos de seguranca; aceita `config_overrides` para testes e outros ambientes.
- `api/app.py`: instancia `app = create_app()` e ponto de entrada `python app.py`.
- `api/routes/`: endpoints HTTP finos (validacao de request/response HTTP, status codes); delegam para servicos via `routes/deps.py`.
- `api/services/`: regras de negocio; recebem repositorios injetados no construtor (sem acessar `db.session` diretamente).
- `api/repositories/`: consultas e persistencia (SQLAlchemy), recebendo a extensao `db` explicitamente.
- `api/models/`: mapeamento ORM
- `api/schemas/`: validacao de dados (Pydantic)
- `api/extensions/`: objetos compartilhados, como banco e limiter

**Convencao:** rota fina → servico (orquestra regras) → repositorio (acesso a dados) → modelo. Isso facilita testes com `create_app({...})` e substituicao de implementacoes na borda.

## Fluxo de autenticacao

1. `POST /auth/register`
2. `UserCreate` valida o payload
3. `create_user` cria o usuario com senha hash
4. `POST /auth/login`
5. `login_user` gera access token e refresh token
6. O frontend envia cookies com `withCredentials`
7. Rotas protegidas usam `@jwt_required()`

## Modelos principais

- `User`: usuario autenticado
- `MeasurementTypeOverride`: sobrescrita de tipo padrao por usuario
- `MeasurementTypeCustom`: tipo customizado por usuario
- `MeasurementTypePreference`: tipo ativo do usuario

## Configuracao importante

- JWT em cookie com CSRF
- CORS configuravel por `FRONTEND_ORIGINS`
- Secret obrigatoria em producao
- Rate limit no login

## Testes

Os testes cobrem:

- cadastro
- login
- logout
- refresh
- rota protegida
- listagem e sincronizacao de tipos de medicao

## Pontos de atencao

- SQLite e valido para desenvolvimento, mas nao e ideal para producao.
- O limiter em memoria precisa ser trocado por Redis para escala real.
- Em producao, use um servidor WSGI como Gunicorn.
