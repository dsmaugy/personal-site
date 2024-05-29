package main

import (
	"darwindo/personal-site/routes"
	"os"

	ginlog "github.com/gin-contrib/logger"
	"github.com/gin-gonic/gin"
	_ "github.com/joho/godotenv/autoload"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

// TODO: caching: https://devcenter.heroku.com/articles/gin-memcache
// TODO: deploying: https://devcenter.heroku.com/articles/getting-started-with-go?singlepage=true#prepare-the-app

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
	r.StaticFile("/favicon.ico", "./static/favicon.ico")
	r.LoadHTMLGlob("./templates/*")

	r.GET("/", routes.Index)
	r.GET("/movies", routes.RecentlyWatched)
	r.GET("/vinyl/:user", routes.VinylCollection)
	r.Run("0.0.0.0:" + os.Getenv("PORT"))

}
