package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog/log"
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
