#!/usr/bin/env bash

set -e

export STACK_NAME="test";

node ../src/index.js diff --write-lhs-rhs -f swarm-app.yml -f swarm-app.diff.yml "$STACK_NAME"
