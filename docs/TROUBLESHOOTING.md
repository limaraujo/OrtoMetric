# Troubleshooting

## 1. Frontend abre mas login falha por conexao

Sintoma:
- mensagem de erro de conexao no formulario

Verifique:
1. backend rodando em `http://localhost:5000`
2. `VITE_API_URL` em `web/.env`
3. CORS inclui `http://localhost:5173`

## 2. Erro 400 no cadastro

Causa comum:
- senha fora da politica

Requisitos:
- 8+ caracteres
- maiuscula, minuscula, numero e simbolo

## 3. Erro 401 no login

Causa comum:
- email/senha invalidos

Passos:
1. testar cadastro
2. testar login com mesmo email/senha
3. validar payload JSON

## 4. Build do frontend passa mas VS Code mostra erro antigo

Causa comum:
- cache do TypeScript server

Acoes:
1. Command Palette -> "TypeScript: Restart TS Server"
2. fechar e abrir a pasta `web`
3. remover `.tsbuildinfo` em `web/node_modules/.tmp` se necessario

## 5. Token nao chega na rota protegida

Verifique:
1. login realmente salvou `access_token` em sessionStorage
2. `api.ts` esta adicionando header Authorization
3. rota backend usa `@jwt_required()`

## 6. Testes backend falham apos mudar regra de senha

Atualize senhas dos testes para atender a politica forte.
Exemplo valido: `TestPass@123`.
