import json
import requests
import logging
import statistics


DISCOGS_EP = "https://api.discogs.com/"

class Discogs():

    def __init__(self, user_token):
        self._header = {'Authorization': 'Discogs token=' + user_token, 'User-Agent': 'flask-agent/1.0 +https://darwindo.com'}

    @staticmethod
    def _check_valid_response(response):
        return response.status_code // 100 == 2

    @staticmethod
    def _sort_collection(collection):
        artist_bucket = {}

        # group releases by artist
        for release in collection:
            if release['artist'] not in artist_bucket:
                artist_bucket[release['artist']] = {'releases': [release]}
            else:
                artist_bucket[release['artist']]['releases'].append(release)

        # find the average release date for each artist bucket
        for k_artist in artist_bucket:
            artist_bucket[k_artist]['avg'] = statistics.mean([y['year'] for y in artist_bucket[k_artist]['releases']])
            artist_bucket[k_artist]['releases'].sort(key=lambda x: x['year'])
        
        sorted_list = list(artist_bucket.values())
        sorted_list.sort(key=lambda x: x['avg'])
        sorted_list_flattened = [z for y in sorted_list for z in y['releases']]

        return sorted_list_flattened


    def _clean_release_dict(self, release_dict, extra_info=False):
        return_dict =  {'title': release_dict['basic_information']['title'],
                'preview_image': release_dict['basic_information']['thumb'], # 'thumb' or 'cover_image'
                'artist': release_dict['basic_information']['artists'][0]['name'],
                'url': "#",
                'year': release_dict['basic_information']['year']
        }

        if extra_info:
            master_info = requests.get(release_dict['basic_information']['master_url'], headers=self._header)
            release_info = requests.get(release_dict['basic_information']['resource_url'], headers=self._header)

            if Discogs._check_valid_response(master_info):
                return_dict['year'] = master_info.json()['year']

            if Discogs._check_valid_response(release_info):
                return_dict['url'] = release_info.json()['uri']

        return return_dict

    def get_user_collection(self, username, extra_info=False):
        all_collection = []

        first_request = requests.get("{}users/{}/collection/folders/0/releases?page=1&per_page=50".format(DISCOGS_EP, username), headers=self._header)
        if not Discogs._check_valid_response(first_request):
            logging.error("Error finding Discogs user", first_request.content)
            return all_collection

        q_json = first_request.json()
        
        all_collection += [self._clean_release_dict(x, extra_info=extra_info) for x in q_json['releases']]

        total_pages = q_json['pagination']['pages']

        for x in range(2, total_pages+1):
            next_request = requests.get("{}users/{}/collection/folders/0/releases?page={}&per_page=50".format(DISCOGS_EP, username, x), headers=self._header)
            Discogs._check_valid_response(next_request)
            q_json = next_request.json()

            all_collection += [self._clean_release_dict(x, extra_info=extra_info) for x in q_json['releases']]
        
        # all_collection.sort(key=lambda x: (x['artist'], x['year']))
        return Discogs._sort_collection(all_collection)
        

        
        

