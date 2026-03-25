# Setup Local

## Requisitos

- Node.js 18+
- npm 9+
- Python 3.11+

## 1. Instalar dependencias

Na raiz do repositorio:

```bash
npm install
```

No backend:

```bash
cd api
python -m pip install -r requirements.txt
```

## 2. Variaveis de ambiente

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

## 3. Subir backend

```bash
cd api
python app.py
```

URL esperada: `http://localhost:5000`

## 4. Subir frontend

```bash
cd web
npm run dev
```

URL esperada: `http://localhost:5173`

## 5. Validar funcionamento rapido

1. Acesse `http://localhost:5173/login`
2. Cadastre um usuario com senha forte (8+, maiuscula, minuscula, numero e simbolo)
3. Faca login
4. Verifique se o redirecionamento para `/` funciona

## Testes e build

Backend:

```bash
cd api
pytest -q
```

Frontend:

```bash
npm run build -w web
```
