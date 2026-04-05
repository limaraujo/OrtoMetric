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

- O limiter usa memoria local.
- O servidor de desenvolvimento nao deve ser usado no deploy.
- O CORS precisa ser fechado para dominios reais.
- Ainda nao ha revogacao persistida de refresh token.

## Boas praticas recomendadas

1. Usar HTTPS obrigatorio.
2. Definir `JWT_SECRET_KEY` forte.
3. Limitar `FRONTEND_ORIGINS` aos dominios oficiais.
4. Usar Redis para rate limit.
5. Fazer logs estruturados e monitoramento.
6. Auditar dependencias com `pip-audit` e `npm audit` no CI.

## Checklist de release

- `FLASK_ENV=production`
- `FLASK_DEBUG=False`
- `JWT_SECRET_KEY` segura
- `FRONTEND_ORIGINS` restrito
- `DATABASE_URL` configurada
- backup de banco configurado
- logs centralizados
