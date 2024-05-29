package routes

import (
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"

	"github.com/rs/zerolog/log"
)

const LetterboxdURL = "https://letterboxd.com/dsmaugy/rss"
const NumMovies = 5
const DiscogsCollectionRequest = "https://api.discogs.com/users/%s/collection/folders/0/releases?page=%d&per_page=50&sort=artist"

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
	Pagination map[string]any   `json:"pagination"`
	Releases   []DiscogsRelease `json:"releases"`
}

type DiscogsRelease struct {
	Info DiscogsReleaseInformation `json:"basic_information"`
}

type DiscogsReleaseInformation struct {
	Title      string `json:"title"`
	Year       int    `json:"year"`
	Thumb      string `json:"thumb"`
	CoverImage string `json:"cover_image"` // larger, higher quality version of thumb
	ReleaseURL string `json:"resource_url"`
}

func getLetterboxdMovies() (*LetterboxdRoot, error) {
	var letterboxd LetterboxdRoot

	log.Info().Msg("Movies")
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
		letterboxd.Channel.Items[i].ImageURL = urlreg.FindString(letterboxd.Channel.Items[i].ImageURL)
	}

	return &letterboxd, nil
}

func getDiscogsRecords(user string) (any, error) {
	var collectionRoot DiscogsCollectionRoot

	client := &http.Client{}
	// TODO: implement pagination and get artist name
	req, _ := http.NewRequest("GET", fmt.Sprintf(DiscogsCollectionRequest, user, 1), nil)
	req.Header.Set("User-Agent", "personal-go-site/1.0 +https://darwindo.com")
	req.Header.Set("Authorization", "Discogs token="+os.Getenv("DISCOGS_TOKEN"))
	resp, err := client.Do(req)

	if err != nil {
		log.Info().Msg("Failed to fetch Discogs API: " + err.Error())
		return nil, err
	}

	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	json.Unmarshal(body, &collectionRoot)

	return &collectionRoot, nil
}
