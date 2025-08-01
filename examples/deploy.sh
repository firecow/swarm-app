#!/usr/bin/env bash

set -e

docker network inspect external &>/dev/null || docker network create external --driver=overlay

export STACK_NAME="test"
export NGINX_FOLDER="/usr/share/nginx/html"
export NGINX_LOCATION="/public"

node ../src/index.js deploy "$STACK_NAME" -f swarm-app.yml -i swarm-app.input.yml

node ../src/index.js wait "$STACK_NAME"
