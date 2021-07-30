from spotipy.oauth2 import SpotifyOAuth

import spotipy
import os

class SpotifyWrap():

    SPOTIFY_SCOPE = "user-top-read"

    def __init__(self):
        self.auth = SpotifyOAuth(scope=SpotifyWrap.SPOTIFY_SCOPE)
        self.auth_token_info = None

    # def is_expired(self):
    #     return self.auth.is_token_expired(self.auth.get_access_token())

    def get_spotify(self):
        if self.auth:
            if not self.auth_token_info:
                self.auth_token_info = self.auth.refresh_access_token(os.environ['SPOTIFY_REFRESH_TOKEN'])
            else:
                self.auth_token_info = self.auth.validate_token(self.auth_token_info)

            return spotipy.Spotify(auth=self.auth_token_info['access_token'])
