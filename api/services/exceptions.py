class AuthError(Exception):
    """Erro base para regras de autenticacao."""


class UserAlreadyExistsError(AuthError):
    """Email ja cadastrado."""


class InvalidCredentialsError(AuthError):
    """Email ou senha invalidos."""
