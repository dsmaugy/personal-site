from flask import Flask, request, jsonify, render_template

import defusedxml.ElementTree as ET
import requests
import re


app = Flask(__name__)

LTRBXD_RSS = "https://letterboxd.com/dsmaugy/rss"
LTRBXD_NS = {"letterboxd": "https://letterboxd.com"}


def get_last_movie():
    # TODO do caching here
    movies = requests.get(LTRBXD_RSS)

    movies_root = ET.fromstring(movies.content)

    first_movie = movies_root[0].findall('item')[0]

    movie_title = first_movie.find("letterboxd:filmTitle", LTRBXD_NS).text
    movie_year = first_movie.find("letterboxd:filmYear", LTRBXD_NS).text
    movie_rating = first_movie.find("letterboxd:memberRating", LTRBXD_NS).text
    movie_portrait = re.search("https://.*\.jpg", first_movie.find("description").text).group()
    movie_verb = "watched" if first_movie.find("letterboxd:rewatch", LTRBXD_NS).text == 'No' else "rewatched"

    latest_movie = {'title': movie_title, 'year': movie_year, 'rating': movie_rating, 'portrait': movie_portrait, 'verb': movie_verb}

    return latest_movie

@app.route('/movies')
def testing():
    return get_last_movie()

@app.route('/html')
def html_test():
    return render_template("index.html")


@app.route('/')
def index():
    return "<h1>Under Construction!</h1>"

if __name__ == '__main__':
    app.run(port=5000)
