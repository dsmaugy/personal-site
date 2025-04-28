package main

import (
	"darwindo/personal-site/api"
	"darwindo/personal-site/routes"
	"html/template"
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

		if c.Request.Host == "www.darwindo.com" || c.Request.Host == "darwindo.com" ||
			c.Request.Host == "www.darwins.cloud" || c.Request.Host == "darwins-cloud.fly.dev" {
			c.Redirect(http.StatusPermanentRedirect,
				"https://darwins.cloud"+c.Request.URL.Path)
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
	cache := persistence.NewMemcachedBinaryStore("localhost:11211", "", "", CacheDuration)
	defer cache.Quit()
	api.InitAPI(cache)

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(ginlog.SetLogger())
	r.Use(requestcheck())
	r.Use(secure.Secure(secure.Options{
		IsDevelopment: os.Getenv("GIN_MODE") == "debug",
	}))

	r.Static("/static", "./static")
	r.StaticFile("/favicon.ico", "./static/favicon.ico")

	r.SetFuncMap(template.FuncMap{
		"safe": func(s string) template.HTML { return template.HTML(s) },
	})
	r.LoadHTMLGlob("./templates/**/*")

	r.GET("/", routes.Index)
	r.GET("/api/movies", routes.RecentlyWatched)
	r.GET("/api/vinyl/:user", routes.VinylCollection)
	r.GET("/api/spotify_top", routes.SpotifyTop)

	// TODO: use hx-push-url="true" and check for HX-History-Restore-Request/Hx-Request header
	// to send full HTML
	r.GET("/home", routes.HomePanel)
	r.GET("/home/vinyl_collection", routes.VinylPanel)
	r.GET("/home/work", routes.ProjectsPanel)
	r.GET("/home/work/:name", routes.ProjectPage)
	r.Run("0.0.0.0:" + os.Getenv("PORT"))
}
