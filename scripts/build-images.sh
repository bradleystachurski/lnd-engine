#!/usr/bin/env bash

set -e -u

ARG=${1:-remote}

echo "Building images with arg: $ARG"

# Default branches for each repo
# TODO: Lock these to a specific commit
LND_VERSION='v0.5.1-sparkswap-beta-rc1'

# We add a COMMIT_SHA argument to the lnd dockerfile to trigger cache-invalidation
# when get git clone the sparkswap/lnd repo. Without it, docker would continue
# to cache old code and we would never receive updates from the fork.
# COMMIT_SHA=`git ls-remote git://github.com/sparkswap/lnd | grep "refs/heads/$LND_VERSION$" | cut -f 1`

# If our LND_VERSION is a tag or a commit, we can use it directly
COMMIT_SHA=${LND_VERSION}

if [[ "$ARG" == "local" ]]; then
  LND_BTC_NODE=btcd
  LND_LTC_NODE=ltcd
else
  LND_BTC_NODE=bitcoind
  LND_LTC_NODE=litecoind
fi

# NOTE: The names specified with `-t` directly map to the service names in
# the applicable services docker-compose file
docker build -t sparkswap_lnd_btc ./docker/lnd --build-arg NODE=$LND_BTC_NODE --build-arg NETWORK=btc --build-arg COMMIT_SHA=$COMMIT_SHA
docker build -t sparkswap_lnd_ltc ./docker/lnd --build-arg NODE=$LND_LTC_NODE --build-arg NETWORK=ltc --build-arg COMMIT_SHA=$COMMIT_SHA

if [[ "$ARG" == "local" ]]; then
  LTCD_CERT_HOST=${LTCD_CERT_HOST:-host.docker.internal}
  BTCD_CERT_HOST=${BTCD_CERT_HOST:-host.docker.internal}
  LTCD_COMMIT_SHA='01737289d815e0e32c91e55593ba2fbd8d090b2c'
  BTCD_COMMIT_SHA='7d2daa5bfef28c5e282571bc06416516936115ee'
  docker build -t sparkswap_btcd ./docker/btcd --build-arg COMMIT_SHA=$BTCD_COMMIT_SHA --build-arg CERT_HOST=$BTCD_CERT_HOST
  docker build -t sparkswap_ltcd ./docker/ltcd --build-arg COMMIT_SHA=$LTCD_COMMIT_SHA --build-arg CERT_HOST=$LTCD_CERT_HOST
else
  BITCOIND_VERSION='0.17.0'
  docker build -t sparkswap_bitcoind ./docker/bitcoind --build-arg VERSION=$BITCOIND_VERSION
  LITECOIND_VERSION='0.16.3'
  docker build -t sparkswap_litecoind ./docker/litecoind --build-arg VERSION=$LITECOIND_VERSION
fi
