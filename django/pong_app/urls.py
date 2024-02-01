from django.urls import path, include
from django.contrib import admin
from django.views.generic import RedirectView
from . import views
from django.conf import settings
from django.conf.urls.static import static
from .views import proxy_view
from .views import save_user_profile_42

urlpatterns = [
	path('', views.homePage, name='homePage'),
	path('proxy/', proxy_view, name='proxy'),
	path('homePage/', views.homePage, name='homePage'),
	path('login/', views.login, name='login'),
	path('pongGame/', views.pongGame, name='pongGame'),
	path('leaderboard/', views.leaderboard, name='leaderboard'),
	path('favicon.ico', RedirectView.as_view(url='/static/favicon.ico')),
	path('profile/', views.profile, name='profile'),
	path('settings/', views.settings, name='settings'),
	path('tournament/', views.tournament, name='tournament'),
	path('chat/', views.chat, name='chat'),	
	path('createAccount/', views.createAccount, name='createAccount'),
	path('save_test_user/', views.save_test_user, name='save_test_user'),
	path('tournament_lobby/<int:tournament_id>/', views.tournament_lobby, name='tournament_lobby'),
	path('tournament_game/<int:tournament_id>/<str:room_name>/', views.tournament_game, name='tournament_game'),
	path('save_user_profile_42/', save_user_profile_42, name='save_user_profile_42'),
	path('save_user_profile_manual/', views.save_user_profile_manual, name='save_user_profile_manual'),
	path('login_user/', views.login_user, name='login_user'),
	path('get_user/<str:user_id>/', views.get_user, name='get_user'),
	path('get_user_by_login/<str:login>/', views.get_user_by_login, name='get_user_by_login'),
	path('get_all_users/', views.get_all_users, name='get_all_users'),
	path('join_or_create_room/<str:user_id>/', views.join_or_create_room, name='join_or_create_room'),
	path('cancel_room/<str:user_id>/', views.cancel_room, name='cancel_room'),
	path('create_tournament/', views.create_tournament, name='create_tournament'),
	path('available_tournaments/', views.available_tournaments, name='available_tournaments'),
	path('join_tournament/<str:user_id>/', views.join_tournament, name='join_tournament'),
	path('leave_tournament/<str:user_id>/', views.leave_tournament, name='leave_tournament'),
	path('get_players_in_tournament/<int:tournament_id>/', views.get_players_in_tournament, name='get_players_in_tournament'),
	path('change_tournament_user_alias/<str:user_id>/', views.change_tournament_user_alias, name='change_tournament_user_alias'),
	path('set_player_ready/', views.set_player_ready, name='set_player_ready'),
	path('create_tournament_game/<int:tournament_id>/<str:room_name>/<str:user_id>/', views.create_tournament_game, name='create_tournament_game'),
	path('get_tournament_status/<int:tournament_id>/', views.get_tournament_status, name='get_tournament_status'),
	path('change_tournament_status/<int:tournament_id>/', views.change_tournament_status, name='change_tournament_status'),
	path('user_win_tournament/<str:user_id>/', views.user_win_tournament, name='user_win_tournament'),
	path('get_client_id/', views.get_client_id, name='get_client_id'),
	path('get_client_secret/', views.get_client_secret, name='get_client_secret'),
	path('exchange_token/', views.exchange_token, name='exchange_token'),
	path('update_user/', views.update_user, name='update_user'),
	path('record_game/', views.record_game, name='record_game'),
	path('get_user_game_history/<str:user_id>/', views.get_user_game_history, name='get_user_game_history'),
	path('set_user_online/<str:user_id>/', views.set_user_online, name='set_user_online'),
	path('set_user_offline/<str:user_id>/', views.set_user_offline, name='set_user_offline'),
	path('accept_friend_request/', views.accept_friend_request, name='accept_friend_request'),
	path('get_friends/<str:user_id>/', views.get_friends, name='get_friends'),
	path('is_user_online/<str:user_id>/', views.is_user_online, name='is_user_online'),
] 

if settings.DEBUG:
	urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)