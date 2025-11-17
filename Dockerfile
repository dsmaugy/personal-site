ARG GO_VERSION=1.24

FROM golang:${GO_VERSION}-bookworm AS build

WORKDIR /usr/src/app
COPY main.go go.mod go.sum ./
COPY api/ api/
COPY routes/ routes/

RUN go mod download && go mod verify
RUN go build -v -o site .

FROM debian:bookworm-slim AS site
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y ca-certificates

COPY --chmod=0755 --from=build /usr/src/app/site ./site
COPY templates/ ./templates/
COPY static/ static/

ENTRYPOINT ["./site"]
