.PHONY: build start stop rmvolume rmi rmall logs all

all: build start

build:
	docker compose -f docker-compose.yml build

start:
	docker compose -f docker-compose.yml up -d && docker compose logs

stop:
	docker compose -f docker-compose.yml down

rmvolume:
	docker volume rm $(shell docker volume ls -qf dangling=true)

rmi:
	docker rmi $(shell docker images -q)

rmall:
	docker stop $(shell docker ps -a -q)
	docker rm $(shell docker ps -a -q)
	$(MAKE) rmvolume

logs:
	docker compose logs

restart:
	$(MAKE) stop
	$(MAKE) start

re:
	$(MAKE) rmall
	$(MAKE) build
	$(MAKE) start