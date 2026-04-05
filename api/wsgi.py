print("WSGI START")

from flask_migrate import upgrade

from factory import create_app

print("AFTER IMPORT FACTORY")

app = create_app()

print("RUNNING MIGRATIONS")
with app.app_context():
	upgrade()
print("MIGRATIONS OK")

print("APP CREATED")