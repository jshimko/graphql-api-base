import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jwt-simple';
import { ObjectId } from 'mongodb';
import nodeify from 'nodeify';
import bcrypt from 'bcrypt';
import Hooks from '../lib/hooks';
import { Logger } from './logger';

async function userFromPayload(request, jwtPayload) {
  if (!jwtPayload.userId) {
    throw new Error('No userId in JWT');
  }
  return await request.context.Users.collection.findOne({ _id: ObjectId(jwtPayload.userId) });
}

export default function authenticate(app) {
  passport.use(new Strategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
    passReqToCallback: true
  }, (request, jwtPayload, done) => {
    nodeify(userFromPayload(request, jwtPayload), done);
  }));

  app.use(passport.initialize());

  app.post('/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        const msg = 'Username or password missing';
        Logger.warn({ email, password }, msg);
        return res.status(401).send(msg);
      }

      const user = await req.context.Users.collection.findOne({ email: email.toLowerCase() });

      if (!user || !(await bcrypt.compare(password, user.password))) {
        const msg = 'User not found matching email/password combination';
        Logger.warn({ email, password }, msg);
        return res.status(401).send(msg);
      }

      Hooks.run('onLogin', user);

      const payload = { userId: user._id.toString() };
      const token = jwt.encode(payload, process.env.JWT_SECRET);

      res.json({ token });
    } catch (e) {
      next(e);
    }
  });
}
