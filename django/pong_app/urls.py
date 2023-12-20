from django.urls import path, include
from django.contrib import admin
from django.views.generic import RedirectView
from .views import save_user_profile
from . import views
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
	path('settings/', views.settings, name='settings'),
	path('tournament/', views.tournament, name='tournament'),
	path('chat/', views.chat, name='chat'),
	path('tournament_lobby/<int:tournament_id>/', views.tournament_lobby, name='tournament_lobby'),
	path('api/save_user_profile/', save_user_profile, name='save_user_profile'),
	path('get_user/<int:user_id>/', views.get_user, name='get_user'),
	path('get_user_by_login/<str:login>/', views.get_user_by_login, name='get_user_by_login'),
	path('get_all_users/', views.get_all_users, name='get_all_users'),
	path('join_or_create_room/<int:user_id>/', views.join_or_create_room, name='join_or_create_room'),
	path('cancel_room/<str:user_id>/', views.cancel_room, name='cancel_room'),
	path('create_tournament/', views.create_tournament, name='create_tournament'),
	path('available_tournaments/', views.available_tournaments, name='available_tournaments'),
	path('join_tournament/<int:user_id>/', views.join_tournament, name='join_tournament'),
	path('leave_tournament/<int:user_id>/', views.leave_tournament, name='leave_tournament'),
]
