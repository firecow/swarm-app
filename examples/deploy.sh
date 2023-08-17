#!/usr/bin/env bash

set -e

export STACK_NAME="test";

NGINX_FOLDER="/usr/share/nginx/html" \
  node ../src/index.js deploy "$STACK_NAME" -f swarm-app.yml -f swarm-app.override.yml

node ../src/index.js wait "$STACK_NAME"
