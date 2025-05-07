ARG GO_VERSION=1.24
FROM golang:${GO_VERSION}-bookworm as builder

WORKDIR /tmp/memcached
# RUN apt-get update && \
#   apt-get -y install libevent-dev
# RUN wget https://memcached.org/files/memcached-1.6.38.tar.gz 
# RUN tar -zxvf memcached-1.6.38.tar.gz && \
#   cd memcached-1.6.38 && \
#   ./configure && make && make test && make install
RUN apt-get update && apt-get install -y memcached

WORKDIR /usr/src/app
COPY go.mod go.sum ./
RUN go mod download && go mod verify
COPY . .
RUN go build -v -o site .

CMD ["/usr/src/app/run.sh"]
