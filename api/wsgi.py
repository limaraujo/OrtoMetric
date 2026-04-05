print("WSGI START")

from factory import create_app

print("AFTER IMPORT FACTORY")

app = create_app()

print("APP CREATED")