package main

import (
	"net/http"
	"os"

	ginlog "github.com/gin-contrib/logger"
	"github.com/gin-gonic/gin"
	_ "github.com/joho/godotenv/autoload"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// TODO: caching: https://devcenter.heroku.com/articles/gin-memcache
// TODO: deploying: https://devcenter.heroku.com/articles/getting-started-with-go?singlepage=true#prepare-the-app
// TODO: fancy logging: https://stackoverflow.com/questions/76508101/how-to-custom-go-gin-logger-format

func index(c *gin.Context) {
	log.Info().Msg("MY URL: " + c.Request.RequestURI)
	c.HTML(http.StatusOK, "index.go.tmpl", nil)
}

// adds https/www redirects where needed
func requestcheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		// if c.Request.URL.Path != "/" {
		// 	c.Redirect(http.StatusMovedPermanently, "/")
		// 	c.Abort()
		// }
	}
}

func init() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
}

func main() {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(ginlog.SetLogger())
	r.Use(requestcheck())

	r.Static("/static", "./static")
	r.StaticFile("/favicon.ico", "./favicon.ico")
	r.LoadHTMLGlob("./templates/*")

	r.GET("/", index)
	r.GET("/test", index)
	r.Run("0.0.0.0:" + os.Getenv("PORT"))

}
