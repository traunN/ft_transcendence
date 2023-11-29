from django.urls import path
from django.views.generic import RedirectView
from . import views
from .views import save_user_profile

urlpatterns = [
	path('', views.homePage, name='homePage'),
    path('homePage/', views.homePage, name='homePage'),
    path('login/', views.login, name='login'),
    path('pongGame/', views.pongGame, name='pongGame'),
	path('leaderboard/', views.leaderboard, name='leaderboard'),
	path('favicon.ico', RedirectView.as_view(url='/static/favicon.ico')),
	path('profil/', views.profil, name='profil'),
	path('settings/', views.settings, name='settings'),
	path('api/save_user_profile/', save_user_profile, name='save_user_profile'),
]
