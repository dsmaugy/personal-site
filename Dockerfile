ARG GO_VERSION=1.27

FROM golang:${GO_VERSION} AS build

WORKDIR /usr/src/app
COPY go.mod go.sum ./
RUN go mod download && go mod verify

COPY main.go ./
COPY api/ api/
COPY routes/ routes/

RUN CGO_ENABLED=0 go build -v -trimpath -ldflags="-s -w" -o site .

FROM gcr.io/distroless/static-debian12:nonroot AS site
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/site ./site
COPY templates/ ./templates/
COPY static/ static/

USER nonroot
ENTRYPOINT ["./site"]
