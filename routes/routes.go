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

const (
	MyDiscogsUsername = "dsmaugy"
	CarouselLimit     = 5
)

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

func getHomePanelVars() gin.H {
	vinyls, _ := api.GetDiscogsRecords(MyDiscogsUsername)
	tracks, _ := api.GetSpotifyTopTracks(25)
	movies, _ := api.GetLetterboxdData()
	// TODO: gracefully handle errors in connectivity
	return gin.H{
		"Vinyls": getRandomSamples(vinyls),
		"Tracks": getRandomSamples(tracks),
		"Movies": movies.Channel.Items[0:5],
	}
}

func Index(c *gin.Context) {
	// log.Info().Msg("MY URL: " + c.Request.RequestURI)
	// c.HTML(http.StatusOK, "home-FULL.html.tmpl", getHomePanelVars())
	c.Redirect(http.StatusPermanentRedirect, "/home")
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

func HomePanel(c *gin.Context) {
	log.Info().Msg("Request for Home page")
	ishtmx := c.GetHeader("Hx-Request")
	log.Info().Msg("Hx-Request: " + ishtmx)
	renderVars := getHomePanelVars()
	renderVars["ishtmx"] = ishtmx
	c.HTML(http.StatusOK, "home.html.tmpl", renderVars)
}

func VinylPanel(c *gin.Context) {
	log.Info().Msg("Request for Vinyl page")
	ishtmx := c.GetHeader("Hx-Request")
	log.Info().Msg("Hx-Request: " + ishtmx)

	vinyls, _ := api.GetDiscogsRecords(MyDiscogsUsername)

	c.HTML(http.StatusOK, "vinyl.html.tmpl", gin.H{
		"Vinyls": vinyls,
		"ishtmx": ishtmx,
	})
}

func ProjectsPanel(c *gin.Context) {
	log.Info().Msg("Request for Projects page")
	ishtmx := c.GetHeader("Hx-Request")
	log.Info().Msg("Hx-Request: " + ishtmx)

	c.HTML(http.StatusOK, "projects.html.tmpl", gin.H{
		"ishtmx": ishtmx,
	})
}

func ProjectPage(c *gin.Context) {
	projectname := c.Param("name")
	log.Info().Msg("Request for Project: " + projectname)
	ishtmx := c.GetHeader("Hx-Request")
	log.Info().Msg("Hx-Request: " + ishtmx)

	c.HTML(http.StatusOK, "project-"+projectname+".html.tmpl", gin.H{
		"ishtmx": ishtmx,
	})
}
