# Frontend

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Axios
- Radix UI

## Estrutura

- `web/src/pages/AuthContainer.tsx`: login e cadastro
- `web/src/pages/DoctorWorkspace.tsx`: gestao de tipos de medicao
- `web/src/pages/MeasurePage.tsx`: tela de medicao
- `web/src/lib/api.ts`: cliente HTTP com refresh automatico
- `web/src/lib/measurementTypes.ts`: sincronizacao de tipos com a API

## Fluxo de autenticao

1. O usuario preenche o formulario.
2. O frontend valida campos basicos.
3. `api.ts` envia as requisicoes com cookies.
4. Em caso de 401, o cliente tenta renovar a sessao.
5. Se a renovacao falhar, o usuario volta para a tela de login.

## Fluxo de medicao

- A imagem e carregada no canvas.
- O toolbar define a ferramenta ativa.
- O usuario escolhe o tipo de medicao.
- A tela renderiza pontos, linhas e resultados.
- O painel lateral mostra as medicoes salvas.

## Componentes relevantes

- `Toolbar`: ferramentas de canvas e controles visuais
- `CanvasBoard`: area principal da imagem
- `MeasurementCanvas`: desenho das medicoes
- `ResultsSidebar`: resumo das medicoes registradas

## Build

```bash
cd web
npm run build
```

## Observacoes

- O frontend depende da API para carregar os tipos de medicao.
- O ambiente de producao deve definir `VITE_API_URL`.
