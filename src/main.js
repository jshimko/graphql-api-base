import API from './lib/api';
import * as models from './models';
import { Logger } from './server/logger';
import { onStartup } from './server/startup';

import UserResolvers from './resolvers/Users';
import EmailsResolvers from './resolvers/Emails';
import ImagesResolvers from './resolvers/Images';
import SettingsResolvers from './resolvers/Settings';

// register all collections
API.createCollection('Users', { resolvers: UserResolvers }, models.Users);
API.createCollection('Emails', { resolvers: EmailsResolvers });
API.createCollection('Images', { resolvers: ImagesResolvers });
API.createCollection('Settings', { resolvers: SettingsResolvers }, models.Settings);

if (!process.env.MONGO_URL) {
  // an external Mongo database is required
  Logger.error('A MONGO_URL must be provided in production');
  process.exit(1);
} else {
  Logger.info(`Connecting to MongoDB at: ${process.env.MONGO_URL}`);

  API.startServer()
    .then(onStartup)
    .catch((e) => Logger.error(e, 'Server startup error'));
}

// Ensure stopping our parent process will properly kill nodemon's process
// https://www.exratione.com/2013/05/die-child-process-die/

// SIGTERM AND SIGINT will trigger the exit event.
process.once('SIGTERM', function () {
  process.exit(0);
});
process.once('SIGINT', function () {
  process.exit(0);
});
// And the exit event shuts down the child.
process.once('exit', function () {
  if (process.env.NODE_ENV !== 'production') {
    const nodemon = require('nodemon');
    nodemon.emit('SIGINT');
  }
});
