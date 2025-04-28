package api

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"time"

	"github.com/gin-contrib/cache/persistence"
	"github.com/rs/zerolog/log"
	"github.com/zmb3/spotify/v2"
	spotifyauth "github.com/zmb3/spotify/v2/auth"
	"golang.org/x/oauth2"
)

const (
	LetterboxdURL            = "https://letterboxd.com/dsmaugy/rss"
	NumMovies                = 5
	DiscogsPaginationMax     = 50
	DiscogsCollectionRequest = "https://api.discogs.com/users/%s/collection/folders/0/releases?page=%d&per_page=%d&sort=artist"
)

type LetterboxdRoot struct {
	XMLName xml.Name          `xml:"rss"`
	Channel LetterboxdChannel `xml:"channel"`
}

type LetterboxdChannel struct {
	XMLName xml.Name         `xml:"channel"`
	Items   []LetterboxdItem `xml:"item"`
}

type LetterboxdItem struct {
	XMLName   xml.Name `xml:"item"`
	Title     string   `xml:"title"`
	WatchDate string   `xml:"watchedDate"`
	Rating    string   `xml:"memberRating"`
	ImageURL  string   `xml:"description"`
}

type DiscogsCollectionRoot struct {
	Pagination DiscogsPagination          `json:"pagination"`
	Releases   []DiscogsCollectionRelease `json:"releases"`
}

type DiscogsPagination struct {
	Items   int                   `json:"items"`
	Page    int                   `json:"page"`
	Pages   int                   `json:"pages"`
	PerPage int                   `json:"per_page"`
	URLS    DiscogsPaginationURLs `json:"urls"`
}

type DiscogsPaginationURLs struct {
	First string `json:"first"`
	Prev  string `json:"prev"`
	Next  string `json:"next"`
	Last  string `json:"last"`
}

type DiscogsCollectionRelease struct {
	Info      DiscogsReleaseInformation `json:"basic_information"`
	DateAdded string                    `json:"date_added"`
}

type DiscogsReleaseInformation struct {
	Title      string          `json:"title"`
	Artists    []DiscogsArtist `json:"artists"`
	Year       int             `json:"year"`
	Thumb      string          `json:"thumb"`
	CoverImage string          `json:"cover_image"` // larger, higher quality version of thumb
	ReleaseURL string          `json:"resource_url"`
}

type DiscogsArtist struct {
	Name string `json:"name"`
}

type VinylInfo struct {
	Name                  string
	Artist                string
	Year                  int
	PreviewImage          string
	DateAddedToCollection string
}

const CacheDuration = time.Minute * 5

var cache *persistence.MemcachedBinaryStore

func InitAPI(c *persistence.MemcachedBinaryStore) {
	cache = c
}

func getCacheKey(key string) string {
	return os.Getenv("MEMCACHIER_PREFIX") + "/dev/" + key
}

func GetLetterboxdData() (*LetterboxdRoot, error) {
	var letterboxd LetterboxdRoot

	movieCacheKey := getCacheKey("movies")
	err := cache.Get(movieCacheKey, &letterboxd)

	if err != nil {
		log.Debug().Err(err).Msg("Letterboxd")
		// cache miss, query form letterboxd directly
		resp, err := http.Get(LetterboxdURL)
		if err != nil {
			log.Info().Msg("Failed to fetch Letterboxd data")
			return nil, err
		}

		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			log.Info().Msg("Error when reading Letterboxd request data")
			return nil, err
		}

		err = xml.Unmarshal(body, &letterboxd)
		if err != nil {
			log.Info().Msg("Error when unmarshalling XML: " + err.Error())
			return nil, err
		}

		letterboxd.Channel.Items = letterboxd.Channel.Items[0:NumMovies]

		// extract the ImageURL from the XML Description section
		urlreg, err := regexp.Compile(`https://.*\.jpg`)
		if err != nil {
			log.Info().Msg("Error when compiling regex")
			return nil, err
		}

		for i := range letterboxd.Channel.Items {
			letterboxd.Channel.Items[i].ImageURL =
				urlreg.FindString(letterboxd.Channel.Items[i].ImageURL)
		}
		cache.Set(movieCacheKey, letterboxd, CacheDuration)
	} else {
		log.Info().Msg("Cache hit for Letterboxd!")
	}

	return &letterboxd, nil
}

func createDiscogsRequest(method string, url string) (*http.Request, error) {
	req, err := http.NewRequest(method, url, nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("User-Agent", "personal-go-site/1.0 +https://darwindo.com")
	req.Header.Set("Authorization", "Discogs token="+os.Getenv("DISCOGS_TOKEN"))
	return req, nil
}

func GetDiscogsRecords(user string) (*[]VinylInfo, error) {
	var collectionRoot DiscogsCollectionRoot
	var vinylList []VinylInfo

	vinylCacheKey := getCacheKey("vinyl")
	err := cache.Get(vinylCacheKey, &vinylList)

	if err != nil {
		// cache miss, query from discogs
		log.Debug().Err(err).Msg("Discogs")

		client := http.Client{}
		lastPage := 1
		for page := 1; page <= lastPage; page++ {
			req, _ := createDiscogsRequest("GET", fmt.Sprintf(DiscogsCollectionRequest, user, page, DiscogsPaginationMax))
			resp, err := client.Do(req)
			if err != nil {
				log.Info().Msg("Failed to fetch Discogs API for collection: " + err.Error())
				return nil, err
			}

			defer resp.Body.Close()
			body, _ := io.ReadAll(resp.Body)

			json.Unmarshal(body, &collectionRoot)
			// log.Info().RawJSON("Json", body).Msg("")

			for _, release := range collectionRoot.Releases {
				var artistName string
				if len(release.Info.Artists) == 0 {
					artistName = "Unknown Artist"
				} else {
					artistName = release.Info.Artists[0].Name
				}

				// NOTE: can't use URLs here because we need to make a request per release to get the discogs URL
				// TODO: format dates
				var dateAddedToCollection string
				parsedDate, err := time.Parse(time.RFC3339, release.DateAdded)
				if err != nil {
					dateAddedToCollection = release.DateAdded
				} else {
					dateAddedToCollection = parsedDate.Format("01/02/06")
				}
				vinylList = append(vinylList, VinylInfo{
					Name:                  release.Info.Title,
					Artist:                artistName,
					Year:                  release.Info.Year,
					PreviewImage:          release.Info.Thumb,
					DateAddedToCollection: dateAddedToCollection,
				})
			}

			lastPage = collectionRoot.Pagination.Pages
			log.Info().Msg("Current page: " + fmt.Sprint(page))
		}

		cache.Set(vinylCacheKey, vinylList, CacheDuration)
	} else {
		log.Info().Msg("Cache hit for Discogs!")
	}

	return &vinylList, nil
}

var spotifyClient *spotify.Client

func getSpotifyClient() *spotify.Client {
	if spotifyClient == nil {
		client := http.Client{}
		req, _ := http.NewRequest("POST", spotifyauth.TokenURL,
			bytes.NewBuffer([]byte(fmt.Sprintf("grant_type=refresh_token&refresh_token=%s", os.Getenv("SPOTIFY_REFRESH_TOKEN")))))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		req.Header.Set("Authorization", fmt.Sprintf("Basic %s",
			base64.StdEncoding.EncodeToString([]byte(
				fmt.Sprintf("%s:%s", os.Getenv("SPOTIFY_ID"), os.Getenv("SPOTIFY_SECRET"))))))
		resp, err := client.Do(req)
		if err != nil {
			spotifyClient = nil
			return spotifyClient
		}

		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)

		refresh_token_resp := make(map[string]string)
		json.Unmarshal(body, &refresh_token_resp)

		auth := spotifyauth.New(spotifyauth.WithScopes(spotifyauth.ScopeUserTopRead))
		expireSeconds, _ := strconv.Atoi(refresh_token_resp["expires_in"])
		token := oauth2.Token{
			AccessToken:  refresh_token_resp["access_token"],
			TokenType:    refresh_token_resp["token_type"],
			RefreshToken: os.Getenv("SPOTIFY_REFRESH_TOKEN"),
			Expiry:       time.Now().Add(time.Second * time.Duration(expireSeconds)),
		}
		spotifyClient = spotify.New(auth.Client(context.Background(), &token))
	}

	return spotifyClient
}

func GetSpotifyTopTracks(numtracks int) (*[]spotify.FullTrack, error) {
	var returntracks []spotify.FullTrack

	spotifyCacheKey := getCacheKey("spotifytrack")
	err := cache.Get(spotifyCacheKey, &returntracks)

	if err != nil {
		// cache miss
		log.Debug().Err(err).Msg("Spotify")

		s := getSpotifyClient()
		tracks, err := s.CurrentUsersTopTracks(context.Background(),
			spotify.Limit(numtracks), spotify.Timerange(spotify.ShortTermRange))
		if err != nil {
			return nil, err
		}

		returntracks = tracks.Tracks
		cache.Set(spotifyCacheKey, returntracks, CacheDuration)
	} else {
		log.Info().Msg("Cache hit for Spotify!")
	}

	log.Info().Msgf("url: %s", returntracks[0].PreviewURL)

	return &returntracks, nil
}
