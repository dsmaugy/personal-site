#!/bin/fish

poetry run pip3 freeze > requirements.txt
poetry run heroku local