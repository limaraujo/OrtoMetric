from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


class UserCreate(BaseModel):
    # Payload de cadastro com validacoes de formato e forca de senha.
    username: str = Field(..., min_length=3, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8)
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        # Exige complexidade minima para reduzir risco de senha fraca.
        if not any(c.isupper() for c in v):
            raise ValueError('Senha deve conter pelo menos uma letra maiúscula')
        if not any(c.islower() for c in v):
            raise ValueError('Senha deve conter pelo menos uma letra minúscula')
        if not any(c.isdigit() for c in v):
            raise ValueError('Senha deve conter pelo menos um número')
        if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in v):
            raise ValueError('Senha deve conter pelo menos um caractere especial')
        return v

class UserResponse(BaseModel):
    # Dados publicos retornados pela API (sem credenciais).
    id: int
    username: str
    email: EmailStr

class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    # Atualizacao parcial de perfil; ao menos um campo deve ser enviado.
    username: str | None = Field(default=None, min_length=3, max_length=80)
    email: EmailStr | None = None

    @model_validator(mode='after')
    def validate_has_at_least_one_field(self):
        # Evita requests vazias de update que nao produzem alteracao.
        if self.username is None and self.email is None:
            raise ValueError('Pelo menos um campo deve ser informado')
        return self
