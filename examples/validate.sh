#!/usr/bin/env bash
set -e

export NGINX_IMAGE_REF=nginx:alpine

node ../src/index.js validate -f swarm-app.yml -i swarm-app.input.yml
