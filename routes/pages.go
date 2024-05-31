package routes

import (
	"context"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
	"github.com/zmb3/spotify/v2"
)

func Index(c *gin.Context) {
	log.Info().Msg("MY URL: " + c.Request.RequestURI)
	c.HTML(http.StatusOK, "index.tmpl.html", nil)
}

func RecentlyWatched(c *gin.Context) {
	movies, err := getLetterboxdMovies()

	if err != nil {
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusOK, movies)
}

func VinylCollection(c *gin.Context) {
	user := c.Param("user")
	vinyls, err := getDiscogsRecords(user)

	if err != nil {
		c.AbortWithError(http.StatusBadRequest, err)
		return
	}

	c.JSON(http.StatusOK, vinyls)
}

func SpotifyTop(c *gin.Context) {
	s := getSpotifyClient()
	tracks, err := s.CurrentUsersTopTracks(context.Background(), spotify.Limit(5))

	if err != nil {
		log.Err(err).Msg("Failed to fetch top tracks")
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	log.Info().Msg(fmt.Sprintf("Spotify API found %d top tracks", len(tracks.Tracks)))

	c.JSON(http.StatusOK, tracks.Tracks)
}
