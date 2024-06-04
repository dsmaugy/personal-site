package routes

import (
	"darwindo/personal-site/api"
	"fmt"
	"math/rand"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/zmb3/spotify/v2"
)

const MyDiscogsUsername = "dsmaugy"
const CarouselLimit = 5

func getRandomSamples[listitem spotify.FullTrack | api.VinylInfo](population *[]listitem) *[5]listitem {
	var returnlist [CarouselLimit]listitem
	used := make(map[int]bool)

	randomidx := -1
	for i := range CarouselLimit {
		idxpresent := true
		for idxpresent {
			randomidx = rand.Intn(len(*population))
			idxpresent = used[randomidx]
		}

		returnlist[i] = (*population)[randomidx]
		used[randomidx] = true
	}

	return &returnlist
}

func Index(c *gin.Context) {
	log.Info().Msg("MY URL: " + c.Request.RequestURI)

	vinyls, _ := api.GetDiscogsRecords(MyDiscogsUsername)
	tracks, _ := api.GetSpotifyTopTracks(25)
	movies, _ := api.GetLetterboxdData()

	c.HTML(http.StatusOK, "index.tmpl.html", gin.H{
		"Vinyls": getRandomSamples[api.VinylInfo](vinyls),
		"Tracks": getRandomSamples[spotify.FullTrack](tracks),
		"Movies": movies.Channel.Items[0:5],
	})
}

func RecentlyWatched(c *gin.Context) {
	movies, err := api.GetLetterboxdData()

	if err != nil {
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusOK, movies)
}

func VinylCollection(c *gin.Context) {
	user := c.Param("user")
	vinyls, err := api.GetDiscogsRecords(user)

	if err != nil {
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusOK, vinyls)
}

func SpotifyTop(c *gin.Context) {
	tracks, err := api.GetSpotifyTopTracks(5)

	if err != nil {
		log.Err(err).Msg("Failed to fetch top tracks")
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	log.Info().Msg(fmt.Sprintf("Spotify API found %d top tracks", len(*tracks)))
	c.JSON(http.StatusOK, tracks)
}
