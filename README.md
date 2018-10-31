
# GraphQL API Server Base

A GraphQL server base to get started with building GraphQL API's.

## Install

```sh
git clone https://github.com/jshimko/graphql-api-base.git

cd graphql-api-base

yarn
```

## Run

### Development

In development, Docker is used to give you an easy local development environment with MongoDB (for API data) and Redis (for the job queue). `Nodemon` provides a live reloading Node server that will refresh on any changes to the contents of the `src/` directory.

To start the Mongo, Redis, and GraphQL API servers:

```sh
npm start
```

The following services should now be available:

**GraphQL Playground UI** - <http://localhost:4000>

**GraphQL API** - <http://localhost:4000/graphql>

**Subscriptions websocket** - <ws://localhost:4000/subscriptions>

**MongoDB** - <mongodb://localhost:27017>

**Redis** - <redis://localhost:6739>


### Production Builds

To create/run a production build:

```sh
# create the build
yarn run build

# optionally prune dev dependencies
yarn --production

# start the production server
# (MONGO_URL/REDIS_URL required)
yarn run serve
```

Or better yet, let Docker build a lean production image for you...

#### Docker

```sh
# build an image
docker-compose build

# run the app, MongoDB, and Redis
docker-compose up -d

# API available at http://localhost:4000
# Mongo available at mongodb://localhost:27017
# Redis available at redis://localhost:6739
```

#### Kubernetes Deployment

This app comes with a [Helm](https://helm.sh/) chart for easy deployment of the API, MongoDB, and Redis on a Kubernetes cluster.  To do a full production deployment:

```sh
# deploy a MongoDB replica set
# https://github.com/helm/charts/tree/master/stable/mongodb-replicaset
helm install --name graphql-api-mongo --namespace myapp stable/mongodb-replicaset

# deploy the API and Redis
helm install --name graphql-api --namespace myapp -f ./chart/custom-values.yaml ./chart
```


## License

Copyright © [MIT](./LICENSE.md)
