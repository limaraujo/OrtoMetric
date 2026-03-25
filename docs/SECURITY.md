# Security

## Implementado hoje

- senha com hash (`generate_password_hash`)
- validacao de senha forte no cadastro
- JWT para rotas protegidas
- checagem de `JWT_SECRET_KEY` em producao
- CORS com lista de origens configuravel
- logging de sucesso/falha em auth

## Riscos atuais

1. token em `sessionStorage` (risco em caso de XSS)
2. sem refresh token
3. sem rate limit no login
4. banco SQLite para ambiente local (nao recomendado em producao)
5. sem CSRF (relevante se migrar para cookie auth)

## Boas praticas para producao

1. usar HTTPS obrigatorio
2. usar `JWT_SECRET_KEY` forte e secreta
3. restringir `FRONTEND_ORIGINS` para dominios oficiais
4. usar PostgreSQL
5. ativar monitoramento e alertas
6. adicionar rate limiting no endpoint de login

## Checklist de release

- [ ] FLASK_ENV=production
- [ ] FLASK_DEBUG=False
- [ ] JWT_SECRET_KEY segura
- [ ] FRONTEND_ORIGINS restrito
- [ ] DATABASE_URL configurada
- [ ] backup de banco configurado
- [ ] logs centralizados
