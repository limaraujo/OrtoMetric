import os

from dotenv import load_dotenv

from extensions.db import db
from factory import create_app

# Carrega variaveis locais para permitir DATABASE_URL em .env durante o start.
load_dotenv()

# Instancia o app Flask usando o app factory para centralizar configuracao.
app = create_app()

if __name__ == "__main__":
    # Cria tabelas no startup local quando executado diretamente.
    # Em producao, o ideal e usar migracoes controladas.
    with app.app_context():
        db.create_all()

    # Parametros de execucao via ambiente para facilitar deploy.
    port = int(os.getenv("PORT", "5000"))
    debug_mode = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
