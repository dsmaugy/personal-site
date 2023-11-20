#!/bin/fish

#  will be exposed on localhost:5000
poetry run pip3 freeze > requirements.txt
poetry run heroku local