import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()
user = User.objects.filter(is_superuser=True).first()

client = APIClient()
client.force_authenticate(user=user)

response = client.get('/api/entities/Product')
print(f"Status Code: {response.status_code}")
print(f"Response Body: {response.content.decode('utf-8')}")
