#!/usr/bin/env bash

set -e

node ../src/index.js validate -f swarm-app.yml -f swarm-app.override.yml
