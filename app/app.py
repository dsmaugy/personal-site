from flask import Flask, request, render_template, redirect
from flask_caching import Cache
from spotifywrap import SpotifyWrap
from logging.config import dictConfig
from random import sample


import defusedxml.ElementTree as ET
import requests
import re
import os


dictConfig({
    'version': 1,
    'formatters': {'default': {
        'format': '[%(asctime)s] [%(levelname)s] [%(funcName)s] %(message)s',
    }},
    'handlers': {'wsgi': {
        'class': 'logging.StreamHandler',
        'stream': 'ext://flask.logging.wsgi_errors_stream',
        'formatter': 'default'
    }},
    'root': {
        'level': 'INFO',
        'handlers': ['wsgi']
    }
})


app = Flask(__name__)

CACHE_CONFIG = {
    "CACHE_TYPE": "SASLMemcachedCache",
    "CACHE_MEMCACHED_SERVERS": [os.environ['MEMCACHIER_SERVERS']],
    "CACHE_MEMCACHED_USERNAME": os.environ['MEMCACHIER_USERNAME'],
    "CACHE_MEMCACHED_PASSWORD": os.environ['MEMCACHIER_PASSWORD'],
    "CACHE_KEY_PREFIX": os.environ['MEMCACHIER_PREFIX'],
    "CACHE_DEFAULT_TIMEOUT": 60,
    'CACHE_OPTIONS': { 'behaviors': {
                        # Faster IO
                        'tcp_nodelay': False,
                        # Keep connection alive
                        'tcp_keepalive': True,
                        # Timeout for set/get requests
                        'connect_timeout': 2000, # ms
                        'send_timeout': 750 * 1000, # us
                        'receive_timeout': 750 * 1000, # us
                        '_poll_timeout': 2000, # ms
                        # No failover
                        'ketama': False}}
}

cache = Cache(config=CACHE_CONFIG)
spotify = SpotifyWrap()


cache.init_app(app)

LTRBXD_RSS = "https://letterboxd.com/dsmaugy/rss"
LTRBXD_NS = {"letterboxd": "https://letterboxd.com"}

@cache.cached(key_prefix='last_movies')
def get_last_movies():
    movies = requests.get(LTRBXD_RSS)
    
    movies_root = ET.fromstring(movies.content)
    movies_list = movies_root[0].findall('item')
    latest_movies = []

    for i in range(0, 5):
        latest_movie = {'name': 'NA', 'year': 'NA', 'rating': 'NA', 'preview_image': 'NA', 'verb': 'NA', 'link': 'NA'}

        latest_movie['name'] = movies_list[i].find("letterboxd:filmTitle", LTRBXD_NS).text
        latest_movie['year'] = movies_list[i].find("letterboxd:filmYear", LTRBXD_NS).text
        latest_movie['rating'] = movies_list[i].find("letterboxd:memberRating", LTRBXD_NS).text
        latest_movie['preview_image'] = re.search("https://.*\.jpg", movies_list[i].find("description").text).group()
        latest_movie['link'] = movies_list[i].find("link").text
        latest_movie['verb'] = "watched" if movies_list[i].find("letterboxd:rewatch", LTRBXD_NS).text == 'No' else "rewatched"

        latest_movies.append(latest_movie)

    return latest_movies

def get_top_songs():
    top_tracks_list = []

    top_tracks = cache.get("toptracks")
    if not top_tracks:
        top_tracks = spotify.get_recent_top_tracks()
        cache.set("toptracks", top_tracks, timeout=3600) # cache timeout can be SUUUPER long
        app.logger.info("Spotify results cached")
    else:
        app.logger.info("Spotify results read from cache")

    for i in sample(range(0, 25), 5):
        latest_song = {'name': 'N/A', 'artist': 'N/A', 'preview_image': 'N/A', 'preview_sound': 'N/A'}
        latest_song['name'] = top_tracks['items'][i]['name']
        latest_song['artist'] = top_tracks['items'][i]['artists'][0]['name']
        latest_song['preview_image'] = top_tracks['items'][i]['album']['images'][1]['url']
        latest_song['preview_sound'] = top_tracks['items'][i]['preview_url']

        top_tracks_list.append(latest_song)
    
    return top_tracks_list

@app.route('/')
def index():
    movies = get_last_movies()
    songs = get_top_songs()

    return render_template("index.html.j2", movies_dict=movies, songs_dict=songs)

@app.before_request
def before_request():
    if os.environ['FLASK_ENV'] == 'production':
        if not request.is_secure:
            url = request.url.replace('http://', 'https://', 1)
            code = 301
            return redirect(url, code=code)
    

if __name__ == '__main__':
    app.run("0.0.0.0", port=5000)