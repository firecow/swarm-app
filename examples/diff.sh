#!/usr/bin/env bash

set -e

export STACK_NAME="test"
export NGINX_FOLDER="/usr/share/nginx/html"
export NGINX_LOCATION="/public-with-diff"
export NGINX_IMAGE_REF=nginx:alpine

node ../src/index.js diff "$STACK_NAME" -f swarm-app.yml -i swarm-app.input.yml --write-lhs-rhs
