import { withFilter } from 'graphql-subscriptions';
import { pubsub } from '../lib/api';

export default {
  Setting: {
    createdByUser(setting, args, { Users }) {
      if (!setting.createdBy) {
        return null;
      }
      return Users.findOneById(setting.createdBy);
    },
    updatedByUser(setting, args, { Users }) {
      if (!setting.updatedBy) {
        return null;
      }
      return Users.findOneById(setting.updatedBy);
    }
  },
  Query: {
    settings(root, args, { Settings }) {
      return Settings.find(args);
    },

    setting(root, args, { Settings }) {
      return Settings.findOne(args);
    }
  },
  Mutation: {
    async setSetting(root, { key, value }, { Settings, userId }) {
      await Settings.updateOne({ key }, { value, updateBy: userId });
      return Settings.findOne({ key });
    },

    unsetSetting(root, args, { Settings }) {
      return Settings.removeOne(args);
    }
  },
  Subscription: {
    settingCreated: {
      subscribe: withFilter(() => pubsub.asyncIterator('settingCreated'), (payload, { _id }) => {
        if (!!_id) {
          return payload.settingCreated._id === _id;
        }
        return !!payload.settingCreated;
      })
    },
    settingUpdated: {
      subscribe: withFilter(() => pubsub.asyncIterator('settingUpdated'), (payload, { _id }) => {
        if (!!_id) {
          return payload.settingUpdated._id === _id;
        }
        return !!payload.settingUpdated;
      })
    },
    settingRemoved: {
      subscribe: withFilter(() => pubsub.asyncIterator('settingRemoved'), (payload, { _id }) => {
        if (!!_id) {
          return payload.settingRemoved._id === _id;
        }
        return !!payload.settingRemoved;
      })
    }
  }
};
