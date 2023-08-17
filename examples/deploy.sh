#!/usr/bin/env bash

set -e

NGINX_FOLDER="/usr/share/nginx/html" \
  STACK_NAME="test" \
  node ../src/index.js deploy test -f swarm-app.yml -f swarm-app.override.yml