from django.urls import path
from django.views.generic import RedirectView
from . import views

urlpatterns = [
	path('', views.homePage, name='homePage'),
    path('homePage/', views.homePage, name='homePage'),
    path('login/', views.login, name='login'),
    path('pongGame/', views.pongGame, name='pongGame'),
	path('leaderboard/', views.leaderboard, name='leaderboard'),
	path('favicon.ico', RedirectView.as_view(url='/static/favicon.ico')),
	path('profil/', views.profil, name='profil'),
	path('settings/', views.settings, name='settings'),
]
