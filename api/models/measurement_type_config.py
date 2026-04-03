from extensions.db import db


class MeasurementTypeOverride(db.Model):
    # Overrides de tipos padrão por usuário (um override por tipo padrão).
    __tablename__ = "measurement_type_override"

    # Chave técnica interna.
    id = db.Column(db.Integer, primary_key=True)
    # Dono do override.
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    # ID do tipo padrão do catálogo base.
    default_type_id = db.Column(db.String(120), nullable=False)
    # Configuração serializada do tipo (JSON em texto).
    payload_json = db.Column(db.Text, nullable=False)

    # Garante apenas um override por usuário para cada tipo padrão.
    __table_args__ = (
        db.UniqueConstraint("user_id", "default_type_id", name="uq_mto_user_default"),
    )


class MeasurementTypeCustom(db.Model):
    # Tipos de medição criados pelo usuário.
    __tablename__ = "measurement_type_custom"

    # ID textual para permitir chaves estáveis legíveis (ex.: slug/uuid).
    id = db.Column(db.String(120), primary_key=True)
    # Dono do tipo customizado.
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True)
    # Configuração serializada do tipo (JSON em texto).
    payload_json = db.Column(db.Text, nullable=False)


class MeasurementTypePreference(db.Model):
    # Preferência ativa de tipo por usuário (no máximo uma por usuário).
    __tablename__ = "measurement_type_preference"

    # Chave técnica interna.
    id = db.Column(db.Integer, primary_key=True)
    # Um registro de preferência por usuário.
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False, index=True, unique=True)
    # Tipo atualmente ativo; pode ser nulo quando não há seleção.
    active_type_id = db.Column(db.String(120), nullable=True)
