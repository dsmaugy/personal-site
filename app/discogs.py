import json
import requests
import logging


DISCOGS_EP = "https://api.discogs.com/"

class Discogs():

    def __init__(self, user_token):
        self._header = {'Authorization': 'Discogs token=' + user_token, 'User-Agent': 'flask-agent/1.0 +https://darwindo.com'}

    @staticmethod
    def _check_valid_response(response):
        return response.status_code // 100 == 2

    @staticmethod
    def _get_json(response):
        return json.loads(response.content.decode('utf-8'))

    @staticmethod
    def _clean_release_dict(release_dict):
        return {'title': release_dict['basic_information']['title'],
                'year': release_dict['basic_information']['year'],
                'preview_image': release_dict['basic_information']['thumb'], # 'thumb' or 'cover_image'
                'artist': release_dict['basic_information']['artists'][0]['name']
        }

    def get_user_collection(self, username):
        all_collection = []

        first_request = requests.get("{}users/{}/collection/folders/0/releases?page=1&per_page=50".format(DISCOGS_EP, username), headers=self._header)
        if not Discogs._check_valid_response(first_request):
            logging.error("Error finding Discogs user", first_request.content)
            return all_collection

        q_json = Discogs._get_json(first_request)
        
        all_collection += list(map(Discogs._clean_release_dict, q_json['releases']))

        total_pages = q_json['pagination']['pages']

        for x in range(2, total_pages+1):
            next_request = requests.get("{}users/{}/collection/folders/0/releases?page={}&per_page=50".format(DISCOGS_EP, username, x), headers=self._header)
            Discogs._check_valid_response(next_request)
            q_json = Discogs._get_json(next_request)

            all_collection += list(map(Discogs._clean_release_dict, q_json['releases']))

        return all_collection
        

        
        

