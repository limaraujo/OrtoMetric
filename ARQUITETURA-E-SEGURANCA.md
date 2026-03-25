# Avaliação de Arquitetura e Segurança - OrtoMetric

Data: 24 de Março de 2026

---

## 🏗️ ARQUITETURA

### Stack Current
- **Backend**: Flask 3.0+ com SQLAlchemy
- **Frontend**: React 19 com TypeScript + Vite
- **Autenticação**: JWT (Flask-JWT-Extended)
- **Database**: SQLite (Development)
- **HTTP Client**: Axios
- **CSS**: Tailwind CSS

### Estrutura Geral (Positivo)
✅ **Separação clara de responsabilidades:**
- Services (lógica de negócio)
- Routes (endpoints)
- Models (entidades)
- Schemas (validação)
- Components (UI reutilizáveis)

✅ **Validação com Pydantic** em schemas

✅ **Type-safe no frontend** com TypeScript

---

## 🔴 VULNERABILIDADES CRÍTICAS

### 1. **Debug Mode em Produção**
**Localização**: `api/app.py:37`
```python
app.run(host="0.0.0.0", port=port, debug=True)  # ❌ NUNCA em produção
```
**Risco**: Exponhe stack traces, permite execução remota de código, carrega módulos automaticamente.

**Solução**:
```python
debug_mode = os.getenv("FLASK_DEBUG", "False").lower() == "true"
app.run(host="0.0.0.0", port=port, debug=debug_mode)
```

---

### 2. **Secret Key Padrão Fraca**
**Localização**: `api/app.py:14-16`
```python
app.config['JWT_SECRET_KEY'] = os.getenv(
    'JWT_SECRET_KEY',
    'dev-only-jwt-secret-key-with-32-plus-bytes'  # ❌ Conhecida publicamente
)
```
**Risco**: Qualquer pessoa pode falsificar JWTs.

**Solução**: Forçar variável de ambiente em produção:
```python
if os.getenv("FLASK_ENV") == "production" and not os.getenv("JWT_SECRET_KEY"):
    raise ValueError("JWT_SECRET_KEY must be set in production")
```

---

### 3. **Banco de Dados SQLite em Produção**
**Localização**: `api/app.py:11`
```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'  # ❌ Não escala
```
**Risco**: 
- Sem concorrência
- Sem backup automatizado
- Lock em leitura/escrita

**Solução**: PostgreSQL/MySQL para produção
```python
db_url = os.getenv("DATABASE_URL", "sqlite:///app.db")
app.config['SQLALCHEMY_DATABASE_URI'] = db_url
```

---

### 4. **Sem Proteção contra Brute Force**
**Localização**: `api/routes/auth.py:26-35` (login endpoint)
```python
@auth_bp.route("/login", methods=["POST"])
def login():
    # ❌ Sem rate limiting, sem tentativas limitadas
    ...
```
**Risco**: Ataque de força bruta em senhas.

**Solução**: Adicionar Flask-Limiter
```python
from flask_limiter import Limiter
limiter = Limiter(app, key_func=lambda: request.remote_addr)

@auth_bp.route("/login", methods=["POST"])
@limiter.limit("5 per minute")  # Max 5 tentativas por minuto
def login():
    ...
```

---

### 5. **Senhas Sem Requisitos Mínimos**
**Localização**: `api/schemas/user_schema.py`
```python
class UserCreate(BaseModel):
    password: str  # ❌ Sem validação de força
```
**Risco**: Senhas fracas como "123" são aceitas.

**Solução**:
```python
from pydantic import field_validator

class UserCreate(BaseModel):
    password: str = Field(..., min_length=8)
    
    @field_validator('password')
    @classmethod
    def password_strength(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Deve conter letra maiúscula")
        if not any(c.isdigit() for c in v):
            raise ValueError("Deve conter número")
        return v
```

---

## 🟡 VULNERABILIDADES DE SEGURANÇA

### 6. **Sem HTTPS (HTTP puro)**
**Localização**: Toda a comunicação

**Risco**: Man-in-the-middle (MITM) pode interceptar tokens JWT.

**Solução**: 
- Produção: HTTPS obrigatório
- Desenvolvimento: SSL/TLS local ou trusted proxy

---

### 7. **Token Armazenado em SessionStorage**
**Localização**: `web/src/pages/AuthContainer.tsx:36-37`
```typescript
sessionStorage.setItem("access_token", data.access_token);
```
**Risco**: XSS pode roubar o token. SessionStorage é melhor que localStorage, mas vulnerável.

**Solução (mais segura - HTTP-only cookies)**:
```typescript
// Backend: enviar token como HTTP-only cookie
response.set_cookie(
    "access_token", 
    token, 
    httponly=True,      # JS não pode acessar
    secure=True,        # Apenas HTTPS
    samesite="Strict"   # Proteção CSRF
)

// Frontend: axios automaticamente envia cookies
```

---

### 8. **Sem Proteção CSRF**
**Localização**: Frontend inteiro

**Risco**: Requisições maliciosas podem ser feitas em nome do usuário.

**Solução**: Implementar CSRF tokens:
```python
# Backend
from flask_wtf.csrf import CSRFProtect
csrf = CSRFProtect(app)

# Frontend
axios.defaults.headers.common['X-CSRFToken'] = getCsrfToken()
```

---

### 9. **Sem Refresh Token**
**Localização**: `api/services/user_service.py:23`
```python
token = create_access_token(identity=str(user.id))  # ❌ Sem expiração visível
```
**Risco**: Token vive indefinidamente ou por tempo muito longo.

**Solução**:
```python
access_token = create_access_token(
    identity=str(user.id), 
    expires_delta=timedelta(minutes=15)  # ✅ Curta duração
)
refresh_token = create_refresh_token(
    identity=str(user.id),
    expires_delta=timedelta(days=7)
)
```

---

### 10. **Sem Logging e Auditoria**
**Localização**: Toda a aplicação

**Risco**: Sem rastreamento de tentativas de hack, violações ou acessos suspeitos.

**Solução**: Adicionar logging estruturado
```python
import logging
logger = logging.getLogger(__name__)

@auth_bp.route("/login", methods=["POST"])
def login():
    logger.info(f"Login attempt: {data.email}")
    try:
        user, token = login_user(data)
        logger.info(f"Login success: {data.email}")
    except ValueError as e:
        logger.warning(f"Login failed: {data.email} - {str(e)}")
```

---

### 11. **CORS Não Validado Suficientemente**
**Localização**: `api/app.py:20-24`
```python
frontend_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:5173,..."  # ✅ Bom em dev, mas em produção?
)
```
**Risco**: Incluir origens de produção em variável pode expor segredos.

**Solução**: Validar por região
```python
allowed_origins = {
    "production": ["https://ortometric.com"],
    "staging": ["https://staging.ortometric.com"],
}
env = os.getenv("ENVIRONMENT", "development")
CORS(app, origins=allowed_origins.get(env, ["http://localhost:*"]))
```

---

## 🟢 BOAS PRÁTICAS IMPLEMENTADAS

✅ Validação com Pydantic
✅ JWT para autenticação stateless
✅ CORS configurável
✅ Separação de responsabilidades (MVC-like)
✅ TypeScript no frontend
✅ SessionStorage em vez de localStorage
✅ Importações type-safe

---

## 📋 CHECKLIST DE AÇÃO

| Prioridade | Item | Status | Prazo |
|-----------|------|--------|--------|
| 🔴 CRÍTICO | Desabilitar debug mode | ⏳ | Imediato |
| 🔴 CRÍTICO | Forçar JWT_SECRET_KEY em produção | ⏳ | Imediato |
| 🔴 CRÍTICO | Migrar para PostgreSQL/MySQL | ⏳ | Sprint 1 |
| 🟡 ALTO | Implementar rate limiting | ⏳ | Sprint 1 |
| 🟡 ALTO | Adicionar requisitos de senha | ⏳ | Sprint 1 |
| 🟡 ALTO | HTTPS obrigatório | ⏳ | Sprint 1 |
| 🟡 ALTO | Refresh token + HTTP-only cookies | ⏳ | Sprint 2 |
| 🟡 ALTO | Logging e auditoria | ⏳ | Sprint 2 |
| 🟡 MÉDIO | CSRF protection | ⏳ | Sprint 3 |
| 🟡 MÉDIO | Security headers (Content-Security-Policy, etc) | ⏳ | Sprint 3 |

---

## 🚀 PRÓXIMOS PASSOS RECOMENDADOS

1. **Criar arquivo `.env` para produção** com valores seguros
2. **Implementar migrations** com Alembic
3. **Adicionar testes de segurança** (OWASP ZAP, Pytest)
4. **Configurar CI/CD** com verificações de segurança
5. **Documentar política de senhas** e 2FA
6. **Implementar observabilidade** (Sentry, CloudWatch)

---

**Avaliação Geral**: ⚠️ **SEGURANÇA FRACA EM PRODUÇÃO** - Atual é apenas adequado para desenvolvimento local.
