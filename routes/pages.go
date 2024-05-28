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
