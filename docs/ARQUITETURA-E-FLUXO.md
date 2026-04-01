# Arquitetura e Fluxo

Este documento resume o caminho dos dados entre frontend e backend.

## Visao geral

```text
Usuario -> AuthContainer / DoctorWorkspace / MeasurePage
       -> web/src/lib/api.ts
       -> API Flask
       -> Services / Models / Schemas
       -> Banco de dados
```

## Fluxo de autenticacao

1. O usuario entra na tela de login.
2. O formulario chama `POST /auth/register` ou `POST /auth/login`.
3. A API valida o payload com Pydantic.
4. O backend gera access token e refresh token.
5. O frontend passa a usar cookies com `withCredentials`.
6. Requisicoes protegidas passam por `@jwt_required()`.

## Fluxo de tipos de medicao

1. O frontend carrega os tipos com `GET /measurement-types`.
2. O usuario edita ou cria tipos no workspace.
3. O frontend envia `PUT /measurement-types/sync`.
4. A API salva tipos padrao, sobrescritas e tipos customizados.
5. O tipo ativo e salvo em `GET/PUT /measurement-types/active`.

## Fluxo de medicao

1. O usuario abre a pagina de medicao.
2. O canvas carrega a imagem.
3. O toolbar define a ferramenta ativa.
4. O usuario marca pontos.
5. O resultado aparece no painel lateral.

## Decisoes de arquitetura

- Separacao em rotas, servicos, schemas e modelos.
- Estado do frontend concentrado em hooks e paginas.
- Cliente HTTP central para refresh e CSRF.
- Persistencia simples para facilitar evolucao posterior.
