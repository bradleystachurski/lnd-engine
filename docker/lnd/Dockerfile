FROM golang:1.10-alpine as builder

LABEL maintainer="sparkswap <dev@sparkswap.com>"

ARG NETWORK
RUN : "${NETWORK:?NETWORK Build argument needs to be set.}"

# Force Go to use the cgo based DNS resolver. This is required to ensure DNS
# queries required to connect to linked containers succeed.
ENV GODEBUG netdns=cgo

# Install dependencies and install/build lnd.
RUN apk add --no-cache \
    git \
    make \
    openssl

# Create certs for LND Engine
RUN mkdir "/secure"

ARG TLS_KEY="/secure/lnd-engine-tls-${NETWORK}.key"
ARG TLS_CERT="/secure/lnd-engine-tls-${NETWORK}.cert"
ARG TLS_CSR="/secure/lnd-engine-csr-${NETWORK}.csr"

# Manually generate certs for NodeJS gRPC
# NOTE: "Beware that lnd autogenerated certificates are not compatible with current
# NodeJS gRPC module implementation. Lnd uses the P-521 curve for its certificates
# but NodeJS gRPC module is only compatible with certificates using the P-256 curve"
#
# More info here: https://github.com/mably/lncli-web#generate-lnd-certificates-compatible-with-nodejs-grpc
#
RUN openssl ecparam -genkey -name prime256v1 -out ${TLS_KEY}
RUN openssl req -new -sha256 -key ${TLS_KEY} -out ${TLS_CSR} -subj "/CN=lnd_${NETWORK}/O=lnd"
RUN openssl req -x509 -sha256 -days 36500 -key ${TLS_KEY} -in ${TLS_CSR} -out ${TLS_CERT}

RUN rm ${TLS_CSR}

WORKDIR $GOPATH/src/github.com/lightningnetwork/lnd

# We use this cache date to always build LND instead of caching the files. This allows us
# to continually grab changes from the LND_VERSION without tagging the release.
# TODO: set this to a certain release commit
ARG COMMIT_SHA=blank
RUN : "${COMMIT_SHA:?COMMIT_SHA Build argument needs to be set.}"

RUN git clone https://github.com/sparkswap/lnd . \
&&  git checkout ${COMMIT_SHA} \
&&  make \
&&  make install

# Start a new, final image to reduce size.
FROM alpine as final

ARG NETWORK
RUN : "${NETWORK:?NETWORK Build argument needs to be set.}"

RUN mkdir "/secure"

# Copy the binaries and entrypoint from the builder image.
COPY --from=builder /go/bin/lncli /bin/
COPY --from=builder /go/bin/lnd /bin/
COPY --from=builder /secure /secure/

# Add bash.
RUN apk add --no-cache \
    bash

# Expose lnd ports (server, rpc).
EXPOSE 9735 10009

# Make lnd folder default.
WORKDIR /home/lnd

COPY "start-lnd-${NETWORK}.sh" "./start-lnd.sh"
RUN chmod +x ./start-lnd.sh

# Set NODE to an env so we can use it in the start script
ARG NODE
RUN : "${NODE:?NODE Build argument needs to be set.}"
ENV NODE ${NODE}

COPY "./conf/lnd-${NODE}.conf" "./lnd.conf"

CMD ["bash", "-c", "NODE=${NODE} ./start-lnd.sh"]
