package main

import (
	"darwindo/personal-site/api"
	"darwindo/personal-site/routes"
	"os"
	"time"

	"github.com/gin-contrib/cache/persistence"
	ginlog "github.com/gin-contrib/logger"
	"github.com/gin-gonic/gin"
	_ "github.com/joho/godotenv/autoload"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

const CacheDuration = time.Minute

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

// func cacheaccess(cache *mc.Client) gin.HandlerFunc {
// 	return func(c *gin.Context) {
// 		c.Set("cache", cache)
// 		c.Next()
// 	}
// }

func init() {
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
}

func main() {
	cache := persistence.NewMemcachedBinaryStore(os.Getenv("MEMCACHIER_SERVERS"), os.Getenv("MEMCACHIER_USERNAME"), os.Getenv("MEMCACHIER_PASSWORD"), CacheDuration)
	defer cache.Quit()
	api.InitAPI(cache)

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(ginlog.SetLogger())
	r.Use(requestcheck())
	// r.Use(cacheaccess(cache))

	r.Static("/static", "./static")
	r.StaticFile("/favicon.ico", "./static/favicon.ico")
	r.LoadHTMLGlob("./templates/**/*")

	r.GET("/", routes.Index)
	r.GET("/api/movies", routes.RecentlyWatched)
	r.GET("/api/vinyl/:user", routes.VinylCollection)
	r.GET("/api/spotify_top", routes.SpotifyTop)

	// TODO: these should all be GET requests
	r.POST("/panel/home", routes.HomePanel)
	r.POST("/panel/vinyl", routes.VinylPanel)
	r.POST("/panel/work", routes.ProjectsPanel)
	r.POST("/panel/work/:name", routes.ProjectPage)
	r.Run("0.0.0.0:" + os.Getenv("PORT"))
}
