import _ from 'lodash';

export default {

  isAuthenticated(next, source, args, { user }) {
    if (!user) {
      throw new Error('Access denied.');
    }

    return next();
  },

  hasRole(next, source, { roles }, { user }) {
    if (!user) {
      throw new Error('Access denied.');
    }

    if (!_.some(roles, (role) => user.roles.includes(role))) {
      throw new Error('Access denied.');
    }

    return next();
  },

  isAdminOrOwner(next, source, args, { user }) {
    if (!user) {
      throw new Error('Access denied.');
    }

    if (!user.roles.includes('admin') || source.userId !== user._id) {
      throw new Error('Access denied.');
    }

    return next();
  }

};
