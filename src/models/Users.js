import bcrypt from 'bcrypt';
import { MongoCollection, Hooks } from '../lib';
import { Logger } from '../server/logger';

class Users extends MongoCollection {

  async insertOne({ email, password, ...rest }) {
    // make sure this email doesn't already exist
    const user = await this.collection.findOne({ email: email.toLowerCase() });

    if (user) {
      const msg = `User with email ${email} already exists`;
      Logger.warn(msg);
      throw new Error(msg);
    }

    // hash the password
    const hash = await bcrypt.hash(password, 10);

    const docToInsert = Object.assign({}, rest, {
      email: email.toLowerCase(),
      password: hash
    });

    // run the onCreateUser hook
    const postHookDoc = Hooks.run('onCreateUser', docToInsert);

    // do the rest of the standard insert
    return super.insertOne(postHookDoc);
  }

  async updateOne(filter, { email, password, ...rest }) {
    const user = await this.collection.findOne(filter);

    if (!user) {
      const msg = 'User not found';
      Logger.warn(msg);
      throw new Error(msg);
    }

    const docToInsert = Object.assign({}, rest, { email: email.toLowerCase() });

    if (password) {
      // hash the password
      docToInsert.password = await bcrypt.hash(password, 10);
    }

    // run the onUpdateUser hook
    const postHookDoc = Hooks.run('onUpdateUser', docToInsert);

    // do the rest of the standard insert
    return super.updateOne(filter, postHookDoc);
  }

  // async insertMany(users) {
  //   const ids = [];
  //
  //   users.forEach(async (user) => {
  //     ids.push((await this.insertOne(user)).insertedId);
  //   });
  //
  //   return ids;
  // }
}

export default Users;
