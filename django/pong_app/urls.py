from django.urls import path
from django.views.generic import RedirectView
from . import views

urlpatterns = [
    path('', views.homePage, name='homePage'),
    path('login/', views.login, name='login'),
    path('pongGame/', views.pongGame, name='pongGame'),
	path('favicon.ico', RedirectView.as_view(url='/static/favicon.ico')),
]
