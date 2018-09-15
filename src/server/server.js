import express from 'express';
import passport from 'passport';
import bodyParser from 'body-parser';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { ApolloServer } from 'apollo-server-express';
import graphqlPlayground from 'graphql-playground-middleware-express';
import { parse } from 'url';
import { Logger } from './logger';
import authenticate from './authenticate';
import API from '../lib/api';

// load the .env file in development (if exists)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}

const {
  ROOT_URL = 'http://localhost:4000',
  PORT = 4000,
  MONGO_PORT = parseInt(PORT, 10) + 1,
  MONGO_DATABASE = 'api',
  MONGO_URL = `mongodb://localhost:${MONGO_PORT}/${MONGO_DATABASE}`
} = process.env;

export default async function startServer() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required for authentication');
  }

  const client = await MongoClient.connect(MONGO_URL, {
    // try to reconnect every second for 2 mins
    reconnectTries: 120,
    reconnectInterval: 1000,
    useNewUrlParser: true
  });

  const db = client.db('api');
  const ctx = API.loadContext({ db });

  const app = express();

  // optional origin whitelist for CORS
  //
  // const originWhitelist = [
  //   'http://localhost:3000',
  //   'http://localhost:4000'
  // ];
  //
  // const corsOptions = {
  //   origin(origin, callback) {
  //     if (originWhitelist.includes(origin) || typeof origin === 'undefined') {
  //       callback(null, true);
  //     } else {
  //       callback(new Error(`CORS error for origin: ${origin}`));
  //     }
  //   }
  // };

  app.use(cors({ origin: '*' }));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  app.use((req, res, next) => {
    req.context = ctx;
    next();
  });

  authenticate(app);

  app.use('/graphql', (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
      req.context = API.addToContext({
        user,
        userId: user && user._id,
        ...req.context
      });

      Logger.debug({
        user: user && user.email,
        variables: req.body.variables,
        query: req.body.query
      }, `[GraphQL request]: ${req.body.operationName}`);

      next();
    })(req, res, next);
  });

  app.get('/', graphqlPlayground({
    endpoint: '/graphql',
    subscriptionEndpoint: `ws://${parse(ROOT_URL).hostname}:${PORT}/subscriptions`
  }));

  const server = new ApolloServer(API.getApolloServerConfig());

  server.applyMiddleware({ app });

  app.listen({ port: PORT }, () => {
    Logger.info(`🚀 API Server is now running on ${ROOT_URL}${server.graphqlPath}`);
    Logger.info(`Websocket server is now running on ws://${parse(ROOT_URL).hostname}:${PORT}/subscriptions`);
  });

  return API.context;
}
