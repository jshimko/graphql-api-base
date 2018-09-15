import { MongoCollection } from '../lib';

class Settings extends MongoCollection {

  async get(key, defaultValue) {
    if (typeof key !== 'string' || !key.length) {
      throw new Error('Settings.get() must be passed a key string');
    }

    const setting = await super.findOne({ key });

    if (!setting) {
      return defaultValue;
    }

    return setting.value;
  }

  async set(key, value) {
    if (typeof key !== 'string' || !key.length || !value) {
      throw new Error('Settings.set() must be passed a key string and a value');
    }

    return super.updateOne({ key }, { key, value }, { upsert: true });
  }
}

export default Settings;
