#!/bin/fish

#  will be exposed on localhost:5000
#poetry run pip3 freeze > requirements.txt
poetry export -f requirements.txt --output requirements.txt
poetry run heroku local
