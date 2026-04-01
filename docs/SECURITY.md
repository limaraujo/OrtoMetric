# Seguranca

## Implementado hoje

- Senhas com hash.
- Validacao forte de senha no cadastro.
- JWT com access token e refresh token.
- Cookies com CSRF habilitado.
- Rate limit no login.
- Headers basicos de seguranca na API.
- CORS configuravel por ambiente.

## Riscos atuais

- SQLite continua sendo um ponto fraco para producao.
- O limiter usa memoria local.
- O servidor de desenvolvimento nao deve ser usado no deploy.
- O CORS precisa ser fechado para dominios reais.

## Boas praticas recomendadas

1. Usar HTTPS obrigatorio.
2. Definir `JWT_SECRET_KEY` forte.
3. Limitar `FRONTEND_ORIGINS` aos dominios oficiais.
4. Trocar SQLite por PostgreSQL.
5. Usar Redis para rate limit.
6. Fazer logs estruturados e monitoramento.

## Checklist de release

- `FLASK_ENV=production`
- `FLASK_DEBUG=False`
- `JWT_SECRET_KEY` segura
- `FRONTEND_ORIGINS` restrito
- `DATABASE_URL` configurada
- backup de banco configurado
- logs centralizados
