print("WSGI START")

import os
import traceback

from flask import Flask
from flask_migrate import upgrade

from factory import create_app


def _is_truthy_env(var_name: str, *, default: bool) -> bool:
	raw_value = os.getenv(var_name)
	if raw_value is None:
		return default
	return raw_value.strip().lower() in {"1", "true", "yes", "on"}


def _run_startup_migrations(flask_app: Flask) -> None:
	should_run = _is_truthy_env("RUN_DB_MIGRATIONS_ON_STARTUP", default=True)
	fail_fast = _is_truthy_env("MIGRATIONS_FAIL_FAST", default=False)

	if not should_run:
		print("MIGRATIONS SKIPPED (RUN_DB_MIGRATIONS_ON_STARTUP=false)")
		return

	print("RUNNING MIGRATIONS")
	try:
		with flask_app.app_context():
			upgrade()
	except Exception:
		print("MIGRATIONS FAILED")
		traceback.print_exc()
		if fail_fast:
			raise
	else:
		print("MIGRATIONS OK")


print("AFTER IMPORT FACTORY")

app = create_app()
_run_startup_migrations(app)

print("APP CREATED")