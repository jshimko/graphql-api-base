import { withFilter } from 'graphql-subscriptions';
import { Storage } from '@google-cloud/storage';
import slugify from 'slugify';
import { pubsub } from '../lib/api';

export default {
  Image: {
    createdByUser(payment, args, { Users }) {
      if (!payment.createdBy) {
        return null;
      }
      return Users.findOneById(payment.createdBy);
    },
    updatedByUser(payment, args, { Users }) {
      if (!payment.updatedBy) {
        return null;
      }
      return Users.findOneById(payment.updatedBy);
    }
  },
  Query: {
    images(root, args, { Images }) {
      return Images.find(args);
    },

    image(root, { _id }, { Images }) {
      return Images.findOneById(_id);
    }
  },
  Mutation: {
    async createImage(root, { input }, { Images, userId }) {
      const _id = await Images.insertOne({ ...input, createdBy: userId });
      return Images.findOneById(_id);
    },

    async uploadImage(root, { file, input }, { Images, Logger, userId }) {
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
      const bucket = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

      if (!projectId || !bucket) {
        const msg = 'No image storage backend is configured';
        Logger.error(msg);
        throw new Error(msg);
      }

      const { stream, filename, mimetype } = await file;

      const _id = await Images.insertOne({ ...input, filename, mimetype, createdBy: userId });
      const name = slugify(filename);
      const path = input.productId ? `images/${input.productId}/${_id}-${name}` : `images/${_id}-${name}`;

      await Images.updateById(_id, {
        path,
        storage: 'google-cloud',
        storageUrl: `https://storage.googleapis.com/${bucket}/${path}`,
        url: `${process.env.IMGIX_URL}/${path}`
      });

      const storage = new Storage({ projectId }).bucket(bucket);

      await new Promise((resolve, reject) =>
        stream
          .pipe(storage.file(path).createWriteStream())
          .on('error', (error) => {
            Logger.error(error);
            reject(error);
          })
          .on('finish', resolve)
      );

      return Images.findOneById(_id);
    },

    async updateImage(root, { _id, input }, { Images, userId }) {
      await Images.updateById(_id, { ...input, updateBy: userId });
      return Images.findOneById(_id);
    },

    updateImages(root, { input }, { Images, userId }) {
      input.forEach(async (image) => await Images.updateById(image._id, { ...input, updateBy: userId }));
      const ids = input.map(({ _id }) => _id);
      return Images.findManyById(ids);
    },

    async removeImage(root, { _id }, { Images, Logger }) {
      const image = await Images.findOneById(_id);

      if (!image) {
        const msg = 'Image not found';
        Logger.error(msg);
        throw new Error(msg);
      }

      if (image.storage === 'google-cloud') {
        const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
        const bucket = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;

        if (!projectId || !bucket) {
          const msg = 'No image storage backend is configured';
          Logger.error(msg);
          throw new Error(msg);
        }

        const storage = new Storage({ projectId }).bucket(bucket);

        await storage.file(image.path).delete()
          .then(() => Logger.debug({ image }, `Successfully deleted image from Google Cloud Storage at path: ${image.path}`))
          .catch((error) => Logger.error(error, 'Failed to delete image from Google Cloud Storage'));
      }

      return Images.removeById(_id);
    }
  },
  Subscription: {
    imageCreated: {
      subscribe: withFilter(() => pubsub.asyncIterator('imageCreated'), (payload, { _id }) => {
        if (!!_id) {
          return payload.imageCreated._id === _id;
        }
        return !!payload.imageCreated;
      })
    },
    imageUpdated: {
      subscribe: withFilter(() => pubsub.asyncIterator('imageUpdated'), (payload, { _id }) => {
        if (!!_id) {
          return payload.imageUpdated._id === _id;
        }
        return !!payload.imageUpdated;
      })
    },
    imageRemoved: {
      subscribe: withFilter(() => pubsub.asyncIterator('imageRemoved'), (payload, { _id }) => {
        if (!!_id) {
          return payload.imageRemoved._id === _id;
        }
        return !!payload.imageRemoved;
      })
    }
  }
};
