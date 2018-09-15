import fs from 'fs';
import path from 'path';
import { Logger } from './logger';

async function loadFixtures(ctx) {
  const fixtures = require('./fixtures.json');

  if (!!fixtures && Array.isArray(fixtures.Users) && fixtures.Users.length > 0) {
    fixtures.Users.forEach(async (user) => {
      const u = await ctx.Users.findOne({ email: user.email });
      if (!u) {
        Logger.debug(`Creating user: ${user.email}`);
        await ctx.Users.insertOne(user);
      } else {
        Logger.debug(`Updating user: ${user.email}`);
        await ctx.Users.updateOne({ email: user.email }, user);
      }
    });
  }
}

// function is run when server startup is complete
export async function onStartup(ctx) {
  loadFixtures(ctx);

  // setup Google Cloud credentials
  if (process.env.GOOGLE_CREDENTIALS_JSON) {
    const file = path.resolve(__dirname, '..', 'google.json');
    fs.writeFileSync(file, process.env.GOOGLE_CREDENTIALS_JSON);
    Logger.debug('Created Google Cloud API credential file at: ' + file);
    process.env.GOOGLE_APPLICATION_CREDENTIALS = file;
  }
}
