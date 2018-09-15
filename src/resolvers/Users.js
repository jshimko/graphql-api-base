import bcrypt from 'bcrypt';
import jwt from 'jwt-simple';
import { withFilter } from 'graphql-subscriptions';
import { pubsub } from '../lib/api';
import Hooks from '../lib/hooks';
import { Logger } from '../server/logger';

const resolvers = {
  Query: {
    users(root, args, { Users }) {
      return Users.find(args);
    },

    user(root, { _id }, { Users }) {
      return Users.findOneById(_id);
    },

    currentUser(root, args, { userId, Users }) {
      return Users.findOne({ _id: userId });
    }
  },
  Mutation: {
    async loginWithPassword(root, { email, password }, { Users }) {
      const user = await Users.findOne({ email: email.toLowerCase() });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        const msg = 'User not found matching email/password combination';
        Logger.warn({ email, password }, msg);
        throw new Error(msg);
      }

      Hooks.run('onLogin', user);

      const payload = { userId: user._id.toString() };
      const token = jwt.encode(payload, process.env.JWT_SECRET_KEY);

      return { token };
    },

    async createUser(root, { input }, { Users }) {
      const _id = await Users.insertOne(input);
      return Users.findOneById(_id);
    },

    async updateUser(root, { _id, input }, { Users }) {
      await Users.updateById(_id, input);
      return Users.findOneById(_id);
    },

    async removeUser(root, { _id }, { Users }) {
      let op;
      try {
        op = await Users.removeById(_id);
      } catch (error) {
        throw error;
      }

      return op.result;
    }
  },
  Subscription: {
    userCreated: {
      subscribe: withFilter(() => pubsub.asyncIterator('userCreated'), (payload, { _id }) => {
        if (!!_id) {
          return payload.userCreated._id === _id;
        }
        return !!payload.userCreated;
      })
    },
    userUpdated: {
      subscribe: withFilter(() => pubsub.asyncIterator('userUpdated'), (payload, { _id }) => {
        if (!!_id) {
          return payload.userUpdated._id === _id;
        }
        return !!payload.userUpdated;
      })
    },
    userRemoved: {
      subscribe: withFilter(() => pubsub.asyncIterator('userRemoved'), (payload, { _id }) => {
        if (!!_id) {
          return payload.userRemoved._id === _id;
        }
        return !!payload.userRemoved;
      })
    }
  }
};

export default resolvers;
