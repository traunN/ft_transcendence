FROM	python:3.8
EXPOSE	8000
WORKDIR	/usr/src/app

COPY	./requirements.txt ./

RUN		pip install --no-cache -r requirements.txt

COPY	./ ./

RUN		pip install --no-cache -r requirements.txt

RUN		python manage.py makemigrations --noinput


CMD ["sh", "-c", "python manage.py migrate && python create_superuser.py && python manage.py runserver 0.0.0.0:8000"]

