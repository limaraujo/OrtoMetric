import os

from dotenv import load_dotenv

from factory import create_app

# Carrega variaveis locais para permitir DATABASE_URL_IPV4 em .env durante o start.
load_dotenv()

# Instancia o app Flask usando o app factory para centralizar configuracao.
app = create_app()

if __name__ == "__main__":
    # Parametros de execucao via ambiente para facilitar deploy.
    port = int(os.getenv("PORT", "5000"))
    debug_mode = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    app.run(host="0.0.0.0", port=port, debug=debug_mode)
