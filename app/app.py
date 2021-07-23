from flask import Flask, request, jsonify, render_template

import defusedxml.ElementTree as ET
import requests
import re


app = Flask(__name__)

LTRBXD_RSS = "https://letterboxd.com/dsmaugy/rss"

def get_last_movie():
    # TODO do caching here
    movies = requests.get(LTRBXD_RSS)

    movies_root = ET.fromstring(movies.content)

    first_movie = movies_root[0].findall('item')[0]
    movie_fulltitle = first_movie.find('title').text
    splitter = re.search(", [0-9]*", movie_fulltitle).group()
    movie_title = movie_fulltitle[0:movie_fulltitle.index(splitter)]

    movie_year = splitter.strip(', ')

    movie_stars = movie_fulltitle[len(movie_title + splitter):].strip(' -')
    movie_rating = len(movie_stars) - (0.5 * (movie_stars[-1] == '½'))

    movie_portrait = re.search("https://.*\.jpg", first_movie.find("description").text).group()

    return {'title': movie_title, 'year': movie_year, 'rating': movie_rating, 'portrait': movie_portrait}

@app.route('/movies')
def testing():
    return get_last_movie()

@app.route('/html')
def html_test():
    return render_template("index.html")


@app.route('/')
def index():
    return "<h1>hello world!!</h1>"

if __name__ == '__main__':
    # Threaded option to enable multiple instances for multiple user access support
    app.run(port=5000)
