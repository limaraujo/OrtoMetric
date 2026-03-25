# Frontend (React)

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Axios
- React Router

## Estrutura principal

```text
web/src/
  App.tsx
  pages/
    Interface.tsx
    AuthContainer.tsx
  components/
    AuthForm.tsx
    CanvasBoard.tsx
    Header.tsx
    ImageLoader.tsx
    MeasurementCanvas.tsx
    ResultsSidebar.tsx
    Toolbar.tsx
    ui/
      AuthSwitch.tsx
      ImagePreview.tsx
      InputField.tsx
      slider.tsx
  lib/
    api.ts
  types/
    auth.ts
```

## Rotas

- `/login`: autenticacao
- `/`: area principal

## AuthContainer (orquestrador de auth)

Arquivo: `pages/AuthContainer.tsx`

Responsavel por:
- estado do formulario
- validacao basica local
- parser de erros de API
- submit de cadastro/login
- armazenamento de token em `sessionStorage`
- redirecionamento para `/`

## AuthForm (apresentacao)

Arquivo: `components/AuthForm.tsx`

Responsavel por:
- renderizar campos
- mostrar erros por campo
- mostrar erro geral
- alternar modo login/cadastro

## Cliente HTTP

Arquivo: `lib/api.ts`

- `baseURL` via `VITE_API_URL`
- interceptor adiciona `Authorization: Bearer <token>` quando houver token

## Guard de rota

Arquivo: `pages/Interface.tsx`

- ao montar, verifica token em `sessionStorage`
- sem token, navega para `/login`

## Melhorias recomendadas

1. usar estado global para auth (context)
2. criar hook `useAuth`
3. implementar logout central
4. padronizar mensagens de erro com i18n
5. adicionar testes de interface (RTL/Cypress)
