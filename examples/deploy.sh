#!/usr/bin/env bash

set -e

export STACK_NAME="test";

docker network inspect external &>/dev/null || docker network create external --driver=overlay

NGINX_FOLDER="/usr/share/nginx/html" \
  node ../src/index.js deploy "$STACK_NAME" -f swarm-app.yml

node ../src/index.js wait "$STACK_NAME"
