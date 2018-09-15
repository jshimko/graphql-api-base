import { withFilter } from 'graphql-subscriptions';
import { pubsub } from '../lib/api';

export default {
  Query: {
    emails(root, args, { Emails }) {
      return Emails.find(args);
    },

    email(root, { _id }, { Emails }) {
      return Emails.findOneById(_id);
    }
  },
  Mutation: {
    async sendEmail(root, { input }, { Email, userId }) {
      Email.send({ ...input, createdBy: userId });
      return { result: true };
    },

    async createEmail(root, { input }, { Emails, userId }) {
      const _id = await Emails.insertOne({ ...input, createdBy: userId });
      return Emails.findOneById(_id);
    },

    async updateEmail(root, { _id, input }, { Emails, userId }) {
      await Emails.updateById(_id, { ...input, updateBy: userId });
      return Emails.findOneById(_id);
    },

    removeEmail(root, { _id }, { Emails }) {
      return Emails.removeById(_id);
    }
  },
  Subscription: {
    emailCreated: {
      subscribe: withFilter(() => pubsub.asyncIterator('emailCreated'), (payload, { _id }) => {
        if (!!_id) {
          return payload.emailCreated._id === _id;
        }
        return !!payload.emailCreated;
      })
    },
    emailUpdated: {
      subscribe: withFilter(() => pubsub.asyncIterator('emailUpdated'), (payload, { _id }) => {
        if (!!_id) {
          return payload.emailUpdated._id === _id;
        }
        return !!payload.emailUpdated;
      })
    },
    emailRemoved: {
      subscribe: withFilter(() => pubsub.asyncIterator('emailRemoved'), (payload, { _id }) => {
        if (!!_id) {
          return payload.emailRemoved._id === _id;
        }
        return !!payload.emailRemoved;
      })
    }
  }
};
