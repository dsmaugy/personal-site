from spotipy.oauth2 import SpotifyOAuth

import spotipy
import os

class SpotifyWrap():

    SPOTIFY_SCOPE = "user-top-read"

    def __init__(self):
        self.auth = SpotifyOAuth(scope=SpotifyWrap.SPOTIFY_SCOPE)
        self.auth_token_info = None

    def get_recent_top_tracks(self, limit=25, time_range="short_term"):
        return self.get_spotify().current_user_top_tracks(limit=limit, time_range=time_range)

    def get_spotify(self):
        if self.auth:
            if not self.auth_token_info:
                self.auth_token_info = self.auth.refresh_access_token(os.environ['SPOTIFY_REFRESH_TOKEN'])
            else:
                self.auth_token_info = self.auth.validate_token(self.auth_token_info)

            return spotipy.Spotify(auth=self.auth_token_info['access_token'])
