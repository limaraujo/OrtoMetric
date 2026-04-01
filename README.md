# OrtoMetric

Aplicacao fullstack para medicoes radiologicas com autenticacao JWT.

## Visao Geral

- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Flask + SQLAlchemy + Pydantic + JWT
- Banco local: SQLite
- Autenticacao: cadastro, login e rota protegida

## Estrutura

```text
OrtoMetric/
	api/      # API Flask
	web/      # Aplicacao React
	docs/     # Documentacao completa
```

## Inicio Rapido

### 1. Instalar dependencias

Na raiz do projeto:

```bash
npm install
```

Backend Python (usando ambiente virtual ja configurado no projeto):

```bash
cd api
python -m pip install -r requirements.txt
```

### 2. Configurar variaveis de ambiente

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

### 3. Rodar backend

```bash
cd api
python app.py
```

API disponivel em `http://localhost:5000`.

### 4. Rodar frontend

```bash
cd web
npm run dev
```

App disponivel em `http://localhost:5173`.

## Scripts Uteis

Frontend:

```bash
npm run dev -w web
npm run build -w web
npm run lint -w web
```

Backend:

```bash
cd api
pytest -q
```

## Documentacao Completa

- [docs/README.md](docs/README.md)
- [docs/SETUP.md](docs/SETUP.md)
- [docs/BACKEND.md](docs/BACKEND.md)
- [docs/FRONTEND.md](docs/FRONTEND.md)
- [docs/API.md](docs/API.md)
- [docs/SECURITY.md](docs/SECURITY.md)
- [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
- [docs/ARQUITETURA-E-FLUXO.md](docs/ARQUITETURA-E-FLUXO.md)
- [docs/ARQUITETURA-SEGURANCA-DEPLOY.md](docs/ARQUITETURA-SEGURANCA-DEPLOY.md)

## Estado Atual

- Login e cadastro funcionais
- Rota protegida no backend (`/auth/me`)
- Validacao de senha forte no backend
- Validacao basica de formulario no frontend
- Logs de autenticacao no backend
