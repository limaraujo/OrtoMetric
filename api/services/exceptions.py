class AuthError(Exception):
    """Erro base para regras de autenticacao."""


class UserAlreadyExistsError(AuthError):
    """Email ja cadastrado."""


class InvalidCredentialsError(AuthError):
    """Email ou senha invalidos."""


class UserNotFoundError(AuthError):
    """Usuario nao encontrado."""


class ProfileConflictError(AuthError):
    """Conflito ao atualizar perfil (username ou email em uso)."""
