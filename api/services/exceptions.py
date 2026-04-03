class AuthError(Exception):
    """Erro base para regras de autenticacao."""


class UserAlreadyExistsError(AuthError):
    # Disparado ao tentar cadastrar email ja existente.
    """Email ja cadastrado."""


class InvalidCredentialsError(AuthError):
    # Disparado quando credenciais nao passam na autenticacao.
    """Email ou senha invalidos."""


class UserNotFoundError(AuthError):
    # Disparado quando ID de usuario nao existe na base.
    """Usuario nao encontrado."""


class ProfileConflictError(AuthError):
    # Disparado em conflitos de unicidade durante update de perfil.
    """Conflito ao atualizar perfil (username ou email em uso)."""
