from django.urls import path
from django.views.generic import RedirectView
from . import views
from .views import save_user_profile
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
	path('', views.homePage, name='homePage'),
	path('homePage/', views.homePage, name='homePage'),
	path('error/', views.error, name='error'),
	path('login/', views.login, name='login'),
	path('pongGame/', views.pongGame, name='pongGame'),
	path('leaderboard/', views.leaderboard, name='leaderboard'),
	path('favicon.ico', RedirectView.as_view(url='/static/favicon.ico')),
	path('profile/', views.profile, name='profile'),
	path('profile/<int:user_id>/', views.profile, name='profile'),
	path('settings/', views.settings, name='settings'),
	path('api/save_user_profile/', save_user_profile, name='save_user_profile'),
	path('get_user/<int:user_id>/', views.get_user, name='get_user'),
]

if settings.DEBUG:
		urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)