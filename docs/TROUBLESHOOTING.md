# Troubleshooting

## 1. Frontend nao conecta na API

Verifique:

1. backend esta rodando em `http://localhost:5000`
2. `VITE_API_URL` esta correto
3. CORS inclui a origem do frontend

## 2. Cadastro falha com erro 400

Causa comum:

- senha fora da politica

Requisitos:

- minimo de 8 caracteres
- uma letra maiuscula
- uma letra minuscula
- um numero
- um caractere especial

## 3. Login falha com erro 401

Verifique:

1. email e senha estao corretos
2. o usuario foi criado com sucesso
3. a API esta retornando cookies

## 4. Sessao some ao recarregar a pagina

Verifique:

1. `withCredentials` esta habilitado no cliente HTTP
2. `JWT_COOKIE_SECURE` esta coerente com o ambiente
3. o dominio e o protocolo estao corretos

## 5. Testes do backend falham

Passos uteis:

1. recriar o ambiente local
2. rodar `pytest -q`
3. validar se `email-validator` esta instalado
4. limpar banco temporario se necessario
