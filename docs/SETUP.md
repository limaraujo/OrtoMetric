# Setup Local

## Requisitos

- Node.js 18+
- npm 9+
- Python 3.11+

## Estrutura

- Backend em `api/`
- Frontend em `web/`
- Documentacao em `docs/`

## 1. Instalar dependencias

Na raiz do projeto:

```bash
npm install
```

No backend:

```bash
cd api
python -m pip install -r requirements.txt
```

No frontend:

```bash
cd web
npm install
```

## 2. Configurar variaveis de ambiente

Backend:

```bash
cd api
cp .env.example .env
```

Frontend:

```bash
cd web
cp .env.example .env
```

## 3. Rodar o backend

```bash
cd api
python app.py
```

API disponivel em `http://localhost:5000`.

## 4. Rodar o frontend

```bash
cd web
npm run dev
```

App disponivel em `http://localhost:5173`.

## 5. Validar rapidamente

1. Acesse a tela de autenticacao.
2. Cadastre um usuario com senha forte.
3. Faca login.
4. Verifique se o dashboard abre.
5. Tente abrir a area de medicao.

## 6. Testes e build

Backend:

```bash
cd api
pytest -q
```

Frontend:

```bash
cd web
npm run build
```
