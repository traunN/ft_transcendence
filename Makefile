.PHONY: build start stop rmvolume rmi rmall logs all djangologs restart re deletemedia


all: build start

build:
	docker compose -f docker-compose.yml build

start:
	docker compose -f docker-compose.yml up && docker compose logs


deletemedia:
	docker exec -it transcendence-django-1 bash -c "find /usr/src/app/pong_app/media/images -type f ! -name 'default.jpg' -delete"

stop:
	docker compose -f docker-compose.yml down

rmvolume:
	docker volume rm static_volume templates_volume transcendence_postgres_data

rmi:
	docker rmi $(shell docker images -q)

rmall:
	docker stop $(shell docker ps -a -q)
	docker rm $(shell docker ps -a -q)

logs:
	docker compose logs

djangologs:
	docker compose logs django

restart:
	$(MAKE) stop
	$(MAKE) start

re:
	$(MAKE) rmall
	$(MAKE) build
	$(MAKE) start
