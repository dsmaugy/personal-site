#!/usr/bin/env python3
"""Obtain a new Spotify refresh token via the Authorization Code flow."""

import base64
import json
import os
import secrets
import sys
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

AUTHORIZE_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"
SCOPES = "user-top-read"
DEFAULT_REDIRECT_URI = "http://127.0.0.1:8888/callback"


def require_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        sys.exit(f"error: environment variable {name} is not set")
    return value


def wait_for_code(redirect_uri: str, state: str) -> str:
    """Run a one-shot local server and return the authorization code."""
    parsed = urllib.parse.urlparse(redirect_uri)
    host = parsed.hostname or "127.0.0.1"
    port = parsed.port or 80
    path = parsed.path or "/"
    result: dict = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            url = urllib.parse.urlparse(self.path)
            if url.path != path:
                self.send_error(404)
                return
            params = urllib.parse.parse_qs(url.query)
            if params.get("state", [None])[0] != state:
                result["error"] = "state mismatch"
            elif "error" in params:
                result["error"] = params["error"][0]
            elif "code" in params:
                result["code"] = params["code"][0]
            else:
                result["error"] = "no code in callback"

            ok = "code" in result
            self.send_response(200 if ok else 400)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            msg = (
                "Authorization complete. You can close this tab."
                if ok
                else f"Authorization failed: {result['error']}"
            )
            self.wfile.write(msg.encode())

    with HTTPServer((host, port), Handler) as server:
        while not result:
            server.handle_request()

    if "error" in result:
        sys.exit(f"error: {result['error']}")
    return result["code"]


def exchange_code(
    code: str, redirect_uri: str, client_id: str, client_secret: str
) -> dict:
    body = urllib.parse.urlencode(
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri,
        }
    ).encode()
    creds = base64.b64encode(f"{client_id}:{client_secret}".encode()).decode()
    req = urllib.request.Request(
        TOKEN_URL,
        data=body,
        headers={
            "Authorization": f"Basic {creds}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        sys.exit(f"error: token request failed ({e.code}): {e.read().decode()}")


def main() -> None:
    client_id = require_env("SPOTIFY_ID")
    client_secret = require_env("SPOTIFY_SECRET")
    redirect_uri = os.environ.get("SPOTIFY_REDIRECT_URI", DEFAULT_REDIRECT_URI)
    state = secrets.token_urlsafe(16)

    auth_url = (
        AUTHORIZE_URL
        + "?"
        + urllib.parse.urlencode(
            {
                "client_id": client_id,
                "response_type": "code",
                "redirect_uri": redirect_uri,
                "scope": SCOPES,
                "state": state,
                "show_dialog": "true",
            }
        )
    )

    print("Opening URL:")
    print(auth_url, flush=True)
    webbrowser.open(auth_url)

    code = wait_for_code(redirect_uri, state)
    tokens = exchange_code(code, redirect_uri, client_id, client_secret)

    refresh_token = tokens.get("refresh_token")
    if not refresh_token:
        sys.exit(f"error: no refresh token in response: {tokens}")

    print("\nNew refresh token:\n")
    print(f"SPOTIFY_REFRESH_TOKEN={refresh_token}")


if __name__ == "__main__":
    main()
