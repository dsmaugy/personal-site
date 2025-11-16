ARG GO_VERSION=1.24

FROM debian:bookworm AS memcached
WORKDIR /tmp/memcached
RUN apt-get update && apt-get install -y memcached

FROM golang:${GO_VERSION}-bookworm AS build

WORKDIR /usr/src/app
COPY main.go go.mod go.sum run.sh ./
COPY api/ api/
COPY routes/ routes/
COPY static/ static/

RUN go mod download && go mod verify
RUN go build -v -o site .

FROM debian:bookworm-slim AS site
WORKDIR /usr/src/app

COPY --chmod=0755 --from=build /usr/src/app/site ./site
COPY templates/ ./templates/

ENTRYPOINT ["./site"]
