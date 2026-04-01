# Backend

## Stack

- Flask
- Flask-SQLAlchemy
- Flask-JWT-Extended
- Flask-CORS
- Flask-Limiter
- Pydantic

## Camadas

- `api/app.py`: configuracao geral da aplicacao
- `api/routes/`: endpoints HTTP
- `api/services/`: regras de negocio
- `api/models/`: persistencia
- `api/schemas/`: validacao de dados
- `api/extensions/`: objetos compartilhados, como banco e limiter

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
