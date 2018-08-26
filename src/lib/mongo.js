import DataLoader from 'dataloader';
import pluralize from 'pluralize';

export default class MongoCollection {

  constructor(type, options = {}, context) {
    if (!type) {
      throw new Error('MongoCollection constructor requires a type');
    }
    if (!context) {
      throw new Error('MongoCollection constructor requires a context object');
    }
    this.type = type;
    this.typeSingular = pluralize.singular(type);
    this.options = options;
    this.context = context;
    this.pubsub = context.pubsub;
    this.collection = context.db.collection(type);
    this.loader = new DataLoader((ids) => this._findByIds(this.collection, ids));
  }

  _findByIds(collection, ids) {
    return collection.find({ _id: { $in: ids } })
      .toArray()
      .then((docs) => {
        const idMap = {};
        docs.forEach((d) => { idMap[d._id] = d; });
        return ids.map((id) => idMap[id]);
      });
  }

  async insertOne(doc, options) {
    const docToInsert = Object.assign({}, doc, {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    const id = (await this.collection.insertOne(docToInsert, options)).insertedId;
    this.pubsub.publish(
      `${this.typeSingular}Created`,
      { [`${this.typeSingular}Created`]: await this.findOneById(id) }
    );
    return id;
  }

  async insertMany(docs, options) {
    const docsToInsert = [];
    docs.forEach((doc) => {
      docsToInsert.push(Object.assign({}, doc, {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
    });
    const ids = (await this.collection.insertMany(docsToInsert, options)).insertedIds;
    this.findManyById(ids);
    ids.forEach(async (id) => {
      this.pubsub.publish(
        `${this.typeSingular}Created`,
        { [`${this.typeSingular}Created`]: await this.findOneById(id) }
      );
    });
    return ids;
  }

  async updateOne(filter, updates, options) {
    const result = await this.collection.findOneAndUpdate(filter, {
      $set: Object.assign({}, updates, {
        updatedAt: new Date().toISOString()
      })
    }, options);
    let id;
    if (!result.value && result.lastErrorObject.upserted) {
      id = result.lastErrorObject.upserted;
    } else {
      id = result.value._id;
    }
    this.loader.clear(id);
    this.pubsub.publish(
      `${this.typeSingular}Updated`,
      { [`${this.typeSingular}Updated`]: await this.findOneById(id) }
    );
    return id;
  }

  async updateMany(filter, updates, options) {
    const docs = await this.find(filter, { fields: { _id: 1 } });
    const result = await this.collection.updateMany(filter, {
      $set: Object.assign({}, updates, {
        updatedAt: new Date().toISOString()
      })
    }, options);
    this.loader.clearAll();
    const ids = docs.map((d) => d._id);
    this.findManyById(ids);
    ids.forEach(async (id) => {
      this.pubsub.publish(
        `${this.typeSingular}Updated`,
        { [`${this.typeSingular}Updated`]: await this.findOneById(id) }
      );
    });
    return result;
  }

  async updateById(_id, updates, options) {
    const result = await this.collection.updateOne({ _id }, {
      $set: Object.assign({}, updates, {
        updatedAt: new Date().toISOString()
      })
    }, options);
    this.loader.clear(_id);
    this.pubsub.publish(
      `${this.typeSingular}Updated`,
      { [`${this.typeSingular}Updated`]: await this.findOneById(_id) }
    );
    return result;
  }

  async removeOne(filter, options) {
    const result = await this.collection.findOneAndDelete(filter, options);
    this.loader.clear(result.value._id);
    this.pubsub.publish(
      `${this.typeSingular}Removed`,
      { [`${this.typeSingular}Removed`]: result.value._id }
    );
    return result;
  }

  async removeMany(filter, options) {
    const docs = await this.find(filter, { fields: { _id: 1 } });
    const result = await this.collection.deleteMany(filter, options);
    docs.forEach((d) => {
      this.loader.clear(d._id);
      this.pubsub.publish(
        `${this.typeSingular}Removed`,
        { [`${this.typeSingular}Removed`]: d._id }
      );
    });
    return result;
  }

  async removeById(_id) {
    const result = await this.collection.deleteOne({ _id });
    this.loader.clear(_id);
    this.pubsub.publish(
      `${this.typeSingular}Removed`,
      { [`${this.typeSingular}Removed`]: _id }
    );
    return result;
  }

  find(filter = {}, options = {}) {
    let { limit, skip, sort } = options;
    limit = limit || 100;
    skip = skip || 0;
    sort = sort || { createdAt: 1 };

    return this.collection.find(filter).limit(limit).skip(skip).sort(sort).toArray();
  }

  findOne(filter = {}, options = {}) {
    if (typeof filter === 'string' || filter && filter._id) {
      const _id = typeof filter === 'string' ? filter : filter._id;
      return this.findOneById(_id);
    }
    return this.collection.findOne(filter, options);
  }

  findOneById(id) {
    return this.loader.load(id);
  }

  findManyById(ids) {
    return this.loader.loadMany(ids);
  }
}
