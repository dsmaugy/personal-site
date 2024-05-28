package routes

import (
	"encoding/xml"
	"io"
	"net/http"
	"regexp"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
)

const LetterboxdURL = "https://letterboxd.com/dsmaugy/rss"
const NumMovies = 5
const DiscogsRequest = "https://api.discogs.com/users/%s/collection/folders/0/releases?page=1&per_page=50"

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
	Pagination map[string]any `json:"pagination"`
}

type DiscogsRelease struct {
	Title     string `json:"title"`
	MasterURL string `json:"master_url"`
}

func RecentlyWatched(c *gin.Context) {
	movies, err := getLetterboxdMovies()

	if err != nil {
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusOK, movies)
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

func getDiscogsRecords() {

}
