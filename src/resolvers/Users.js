const resolvers = {
  Query: {
    users(root, { lastCreatedAt, limit }, { Users }) {
      return Users.all({ lastCreatedAt, limit });
    },

    user(root, { _id }, { Users }) {
      return Users.findOneById(_id);
    }
  },
  Mutation: {
    async createUser(root, { input }, { Users }) {
      const _id = await Users.insert(input);
      return Users.findOneById(_id);
    },

    async updateUser(root, { _id, input }, { Users }) {
      await Users.updateById(_id, input);
      return Users.findOneById(_id);
    },

    removeUser(root, { _id }, { Users }) {
      return Users.removeById(_id);
    }
  },
  Subscription: {
    userCreated: user => user,
    userUpdated: user => user,
    userRemoved: _id => _id
  }
};

export default resolvers;