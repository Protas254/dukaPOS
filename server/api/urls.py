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
    path('auth/register-tenant/', views.register_tenant, name='register_tenant'),
    path('tenants/onboard/', views.onboard_tenant, name='onboard_tenant'),
    path('tenants/my-tenants/', views.manage_user_tenants, name='manage_user_tenants'),
    path('tenants/switch/', views.switch_active_tenant, name='switch_active_tenant'),
    path('auth/verify-otp/', views.auth_verify_otp, name='auth_verify_otp'),
    path('auth/resend-otp/', views.auth_resend_otp, name='auth_resend_otp'),
    path('auth/google/', views.auth_google_login, name='auth_google_login'),
    path('entities/<str:entity_name>', views.entity_list_create, name='entity_list_create'),
    path('entities/<str:entity_name>/filter', views.entity_filter, name='entity_filter'),
    path('entities/<str:entity_name>/<str:pk>', views.entity_detail, name='entity_detail'),
    path('tenants/cashiers/', views.tenant_cashiers, name='tenant_cashiers'),
    path('tenants/cashiers/<str:cashier_id>', views.tenant_cashier_detail, name='tenant_cashier_detail'),
    path('tenants/cashiers/invite/', views.invite_cashier, name='invite_cashier'),
    path('auth/invite/accept/', views.accept_cashier_invite, name='accept_cashier_invite'),
    path('functions/invoke', views.functions_invoke, name='functions_invoke'),
    path('analytics', views.analytics_view, name='analytics_view'),
    path('receipters/engine-stats', views.receipters_engine_stats, name='receipters_engine_stats'),
    path('receipters/vault/sign-url', views.receipters_vault_sign_url, name='receipters_vault_sign_url'),
]
