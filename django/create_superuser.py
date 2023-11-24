import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pong_game.settings')
import django
django.setup()

from django.contrib.auth.models import User

if not User.objects.filter(username='admin').exists():
	User.objects.create_superuser('admin', 'admin@example.com', 'admin')