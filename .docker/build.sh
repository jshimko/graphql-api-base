#!/bin/sh

if [ "$1" == "--dev" ]; then
  printf "\n[-] Building development image...\n\n"
  docker build -f docker/dev.dockerfile -t graphql-api:devel .
else
  docker build -t graphql-api:latest .
fi
