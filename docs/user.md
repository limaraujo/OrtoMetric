# Jornada do Usuario

## 1. Primeiro acesso

1. Usuario abre `/login`
2. Escolhe `Cadastro`
3. Informa usuario, email e senha
4. Frontend valida campos basicos
5. Backend valida regras completas e cria conta

## 2. Login

1. Usuario informa email e senha
2. Frontend envia para `POST /auth/login`
3. Backend retorna `access_token`
4. Frontend salva token em `sessionStorage`
5. Usuario e redirecionado para `/`

## 3. Uso da area principal

1. Ao entrar em `/`, o app verifica token
2. Sem token, volta para `/login`
3. Com token, libera interface de medicao

## 4. Fluxo de medicao (alto nivel)

1. Usuario carrega imagem
2. Ajusta zoom, brilho, contraste e pan
3. Marca pontos para medir angulo de Cobb
4. Visualiza resultado no painel lateral
5. Pode desfazer, refazer e limpar

## 5. Erros visiveis para o usuario

- erro por campo no formulario (email/senha/usuario)
- erro geral de autenticacao
- mensagem de servidor indisponivel