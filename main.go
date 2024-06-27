package main

import (
	"darwindo/personal-site/api"
	"darwindo/personal-site/routes"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cache/persistence"
	ginlog "github.com/gin-contrib/logger"
	"github.com/gin-gonic/contrib/secure"
	"github.com/gin-gonic/gin"
	_ "github.com/joho/godotenv/autoload"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
)

const CacheDuration = time.Minute

// TODO: deploying: https://devcenter.heroku.com/articles/getting-started-with-go?singlepage=true#prepare-the-app

// adds https/www redirects where needed
func requestcheck() gin.HandlerFunc {
	return func(c *gin.Context) {
		log.Info().Msg("Host: " + c.Request.Host)
		log.Info().Msg("Path: " + c.Request.URL.Path)
		log.Info().Msg("Scheme: " + c.Request.URL.Scheme)

		if c.Request.Host == "www.darwindo.com" || c.Request.Host == "darwindo.com" {
			c.Redirect(http.StatusPermanentRedirect, "https://darwins.cloud"+c.Request.URL.Path)
			c.Abort()
			return
		} else if c.Request.Host == "www.darwins.cloud" {
			c.Redirect(http.StatusPermanentRedirect, "https://darwins.cloud"+c.Request.URL.Path)
			c.Abort()
			return
		}
		c.Next()
	}
}

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
	r.Use(secure.Secure(secure.Options{
		// AllowedHosts:  []string{"darwins.cloud"},
		// SSLRedirect:   true,
		IsDevelopment: os.Getenv("GIN_MODE") == "debug",
	}))

	r.Static("/static", "./static")
	r.StaticFile("/favicon.ico", "./static/favicon.ico")
	r.LoadHTMLGlob("./templates/**/*")

	r.GET("/", routes.Index)
	r.GET("/api/movies", routes.RecentlyWatched)
	r.GET("/api/vinyl/:user", routes.VinylCollection)
	r.GET("/api/spotify_top", routes.SpotifyTop)

	// TODO: use hx-push-url="true" and check for HX-History-Restore-Request/Hx-Request header
	// to send full HTML
	r.GET("/home", routes.HomePanel)
	r.GET("/vinyl", routes.VinylPanel)
	r.GET("/work", routes.ProjectsPanel)
	r.GET("/work/:name", routes.ProjectPage)
	r.Run("0.0.0.0:" + os.Getenv("PORT"))
}
