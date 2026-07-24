from django.urls import path
from django.http import JsonResponse
from . import views

def health_check(request):
    return JsonResponse({'status': 'ok'}, status=200)

urlpatterns = [
    path('health/', health_check, name='health_check'),
    path('auth/me/', views.auth_me, name='auth_me'),
    path('auth/login/', views.auth_login, name='auth_login'),
    path('auth/register/', views.auth_register, name='auth_register'),
    path('auth/verify-otp/', views.auth_verify_otp, name='auth_verify_otp'),
    path('auth/resend-otp/', views.auth_resend_otp, name='auth_resend_otp'),
    path('auth/google/', views.auth_google_login, name='auth_google_login'),
    path('entities/<str:entity_name>', views.entity_list_create, name='entity_list_create'),
    path('entities/<str:entity_name>/filter', views.entity_filter, name='entity_filter'),
    path('entities/<str:entity_name>/<str:pk>', views.entity_detail, name='entity_detail'),
    path('functions/invoke', views.functions_invoke, name='functions_invoke'),
    path('analytics', views.analytics_view, name='analytics_view'),
]
