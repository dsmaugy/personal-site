from flask import Flask, request, jsonify, render_template
from spotipy.oauth2 import SpotifyOAuth

import defusedxml.ElementTree as ET
import requests
import re
import os
import spotipy
import random


app = Flask(__name__)

LTRBXD_RSS = "https://letterboxd.com/dsmaugy/rss"
LTRBXD_NS = {"letterboxd": "https://letterboxd.com"}

SPOTIFY_SCOPE = "user-top-read"

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
    movie_verb = "watched" if first_movie.find("letterboxd:rewatch", LTRBXD_NS).text == 'No' else "rewatched"

    latest_movie = {'title': movie_title, 'year': movie_year, 'rating': movie_rating, 'portrait': movie_portrait, 'verb': movie_verb}

    return latest_movie

def get_top_song():
    # TODO do caching here
    latest_song = {'name': 'N/A', 'artist': 'N/A', 'preview_image': 'N/A'}

    # token = spotipy.util.prompt_for_user_token(os.environ['SPOTIFY_USERNAME'], SPOTIFY_SCOPE)
    # spotify = spotipy.Spotify(auth=token)
    spotify = spotipy.Spotify(auth_manager=SpotifyOAuth(scope=SPOTIFY_SCOPE))
    top_tracks = spotify.current_user_top_tracks(limit=5, time_range="short_term")

    selector = random.randint(0, len(top_tracks['items'])-1)
    
    latest_song['name'] = top_tracks['items'][selector]['name']  
    latest_song['artist'] = top_tracks['items'][selector]['artists'][0]['name'] # TODO add support for multiple artists?
    latest_song['preview_image'] = top_tracks['items'][selector]['album']['images'][1]['url']

    return latest_song

    

@app.route('/movies')
def last_movie_view():
    return get_last_movie()

@app.route('/song')
def last_songs_view():
    return get_top_song()

@app.route('/html')
def html_test():
    return render_template("index.html")

@app.route('/spotify_callback')
def spotify_callback():
    return "Ok"


@app.route('/')
def index():
    return "<h1>Under Construction!</h1>"

if __name__ == '__main__':
    app.run("0.0.0.0", port=5000)