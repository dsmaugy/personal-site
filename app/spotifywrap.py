from spotipy.oauth2 import SpotifyOAuth

import spotipy
import os

class SpotifyWrap():

    SPOTIFY_SCOPE = "user-top-read"

    def __init__(self):
        self.auth = SpotifyOAuth(scope=SpotifyWrap.SPOTIFY_SCOPE)
        self.auth_at = None

    def get_spotify(self):
        if self.auth:
            if not self.auth_at or self.auth.is_token_expired(self.auth.get_access_token()):
                print("hello!!")
                self.auth_at = self.auth.refresh_access_token(os.environ['SPOTIFY_REFRESH_TOKEN'])['access_token']

            return spotipy.Spotify(auth=self.auth_at)