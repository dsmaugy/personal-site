from flask import Flask, request, jsonify, render_template
from flask_caching import Cache
from spotifywrap import SpotifyWrap

import defusedxml.ElementTree as ET
import requests
import re
import random


app = Flask(__name__)

# for testing, remove later TODO
# app.config['TEMPLATES_AUTO_RELOAD'] = True

spotify = SpotifyWrap()

LTRBXD_RSS = "https://letterboxd.com/dsmaugy/rss"
LTRBXD_NS = {"letterboxd": "https://letterboxd.com"}

# TODO add logic if query fails. Define latest_movie with null values and overwrite them.
def get_last_movie():
    # TODO do caching here
    movies = requests.get(LTRBXD_RSS)

    movies_root = ET.fromstring(movies.content)

    first_movie = movies_root[0].findall('item')[0]

    movie_title = first_movie.find("letterboxd:filmTitle", LTRBXD_NS).text
    movie_year = first_movie.find("letterboxd:filmYear", LTRBXD_NS).text
    movie_rating = first_movie.find("letterboxd:memberRating", LTRBXD_NS).text
    movie_portrait = re.search("https://.*\.jpg", first_movie.find("description").text).group()
    movie_link = first_movie.find("link").text
    movie_verb = "watched" if first_movie.find("letterboxd:rewatch", LTRBXD_NS).text == 'No' else "rewatched"

    latest_movie = {'title': movie_title, 'year': movie_year, 'rating': movie_rating, 'preview_image': movie_portrait, 'verb': movie_verb, 'link': movie_link}

    return latest_movie

def get_top_song():
    # TODO do caching here
    top_tracks_list = []
    print("Token status before context: ", spotify.is_expired())
    spotify_ctx = spotify.get_spotify()
    print("Token status after context: ", spotify.is_expired())
    top_tracks = spotify_ctx.current_user_top_tracks(limit=5, time_range="short_term")

    for i in range(0, 5):
        latest_song = {'name': 'N/A', 'artist': 'N/A', 'preview_image': 'N/A'}
        latest_song['name'] = top_tracks['items'][i]['name']
        latest_song['artist'] = top_tracks['items'][i]['artists'][0]['name']
        latest_song['preview_image'] = top_tracks['items'][i]['album']['images'][1]['url']

        top_tracks_list.append(latest_song)
    
    # latest_song['name'] = top_tracks['items'][selector]['name']
    # latest_song['artist'] = top_tracks['items'][selector]['artists'][0]['name'] # TODO add support for multiple artists?
    # latest_song['preview_image'] = top_tracks['items'][selector]['album']['images'][1]['url']

    return top_tracks_list

    

@app.route('/movie')
def last_movie_view():
    return get_last_movie()

@app.route('/song')
def last_songs_view():
    return get_top_song()

@app.route('/html')
def html_test():
    movies = get_last_movie()
    songs = get_top_song()

    return render_template("index.html", movie_dict=movies, songs_dict=songs)

@app.route('/spotify_callback')
def spotify_callback():
    print("hello1")
    return "Ok"

@app.route('/')
def index():
    return "<h1>Under Construction!</h1>"


if __name__ == '__main__':
    app.run("0.0.0.0", port=5000)