import fs from 'fs';
import _ from 'lodash';
import { PubSub } from 'graphql-subscriptions';
import MongoCollection from './mongo';
import schemas from '../schemas';
import resolvers from '../resolvers';
import directiveResolvers from '../resolvers/_directives';
import GraphqlToMongodb from '../resolvers/schema-directives/graphqlToMongodb';
import Email from '../server/email';
import startServer from '../server/server';
import { Logger } from '../server/logger';

export const pubsub = new PubSub();

const API = {
  Collections: {},
  models: {},
  schemas,
  resolvers,
  directiveResolvers,
  context: { pubsub },
  pubsub,

  startServer() {
    this.loadSchemas();
    return startServer();
  },

  requireGraphQL(name) {
    const file = require.resolve(name);
    try {
      return fs.readFileSync(file, 'utf8');
    } catch (e) {
      throw new Error(`Failed to load schema at path: ${file} \n${e}`);
    }
  },

  createCollection(name, options = {}, collection = MongoCollection) {
    if (!name) {
      throw new TypeError('Model name string is required for "createCollection"');
    }
    if (typeof options.schema === 'string') {
      this.addSchema(options.schema);
    }
    if (typeof options.resolvers === 'object') {
      this.addResolvers(options.resolvers);
    }
    this.models[name] = { options, collection };
  },

  addSchema(schema) {
    if (typeof schema !== 'string') {
      throw new TypeError('Schema passed to addSchema must be a String');
    }
    this.schemas.push(schema);
  },

  addResolvers(obj = {}) {
    return _.merge(this.resolvers, obj);
  },

  addToContext(obj = {}) {
    return _.merge(this.context, obj);
  },

  getApolloServerConfig() {
    return {
      typeDefs: this.schemas,
      resolvers: this.resolvers,
      context: this.context,
      directiveResolvers: this.directiveResolvers,
      schemaDirectives: {
        graphqlToMongodb: GraphqlToMongodb
      },
      playground: false,
      introspection: true,
      cors: false,
      debug: process.env.NODE_ENV !== 'production',
      formatError(error) {
        Logger.error(error.message);
        return error;
      }
    };
  },

  loadSchemas() {
    Object.keys(this.models).forEach((name) => {
      const model = this.models[name];
      if (typeof model.options.schema === 'string') {
        this.addSchema(model.options.schema);
      }
    });
  },

  loadContext(context = {}) {
    const newContext = Object.assign({}, this.context, context);
    Object.keys(this.models).forEach((name) => {
      const model = this.models[name];
      const restOfOpts = _.omit(model.options, ['schema', 'resolvers']);
      this.Collections[name] = new model.collection(name, restOfOpts, newContext);
    });
    this.context = { ...newContext, ...this.Collections, Email, Logger };
    return this.context;
  }
};

export default API;
