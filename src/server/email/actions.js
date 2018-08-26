import fs from 'fs';
import path from 'path';
import sendgrid from '@sendgrid/mail';
import Queue from 'bull';
import Handlebars from 'handlebars';
import htmlToText from 'html-to-text';
import { Logger } from '../logger';
import API from '../../lib/api';

// setup any required partials for layout, header, footer, etc.
Handlebars.registerPartial('styles', getTemplate('layouts/partials/styles'));
Handlebars.registerPartial('Logo', getTemplate('layouts/partials/logo'));
Handlebars.registerPartial('Footer', getTemplate('layouts/partials/footer'));

// job queue instance for email sending
const emailQueue = new Queue('sendEmail', process.env.REDIS_URL || 'redis://localhost:6379');

// process email jobs
emailQueue.process((job, done) => {
  const { from, to, subject, text, html, type, template } = job.data;

  if (!from || !to || !subject || !html) {
    const msg = 'Email job requires an options object with to/from/subject/html.';
    Logger.error(`[Job]: ${msg}`);
    return done(new Error(msg));
  }

  const { Emails } = API.Collections;

  Emails.updateOne({ jobId: job.id }, {
    from,
    to,
    subject,
    text,
    html,
    type,
    template,
    status: 'processing'
  }, {
    upsert: true
  });

  const apiKey = process.env.SENDGRID_API_KEY;

  if (!apiKey) {
    const msg = 'Email job failed: missing Sendgrid API key. Please set SENDGRID_API_KEY env var';
    Logger.error(msg);
    return done(new Error(msg));
  }

  sendgrid.setApiKey(apiKey);

  sendgrid.send({ from, to, subject, text, html }, (error) => {
    if (error) {
      Emails.updateOne({ jobId: job.id }, {
        status: 'failed'
      });

      Logger.error(error, 'Email job failed');

      return done(error);
    }

    Emails.updateOne({ jobId: job.id }, {
      status: 'completed'
    });

    Logger.info(`Successfully sent email to ${to}`);

    return done();
  });
});


/**
 * Email.send()
 * add an email sending job to the queue
 * (Job API doc) https://github.com/OptimalBits/bull/blob/master/REFERENCE.md
 * @param  {Object} options - object containing to/from/subject/html String keys
 * @return {Queue} returns queue object
 */
export function send(options) {
  return emailQueue.add(options, {
    attempts: 3,
    backoff: {
      type: 'fixed',
      delay: 60000 * 3 // 3 mins
    }
  });
}


/**
 * Email.getTemplate(name)
 * get an HTML email template as a string from /server/email/templates
 * @param {String} name - path and name of the HTML email template file in /server/email/templates
 * @returns {Object} returns an HTML string
 */
export function getTemplate(name) {
  if (typeof name !== 'string') {
    const msg = 'Email.getTemplate() requires a template name';
    Logger.error(msg);
    throw new Error(msg);
  }

  const filePath = path.join(__dirname, 'templates', name) + '.html';

  let file;

  try {
    file = fs.readFileSync(filePath, { encoding: 'utf8' });
  } catch(e) {
    Logger.error(e, 'Failed to read email template');
    throw e;
  }

  return file;
}


/**
 * Email.render(template, values)
 * @param {String} template - path and name of the HTML email template file in /server/email/templates
 * @param {Object} values - an object to render dynamic Handlebars values in the template
 * @returns {Object} returns an HTML string
 */
export function render(template, values = {}) {
  if (typeof template !== 'string') {
    const msg = 'Email.render() requires a template name';
    Logger.error(msg);
    throw new Error(msg);
  }

  return Handlebars.compile(getTemplate(template))(values);
}


/**
 * Email.renderText(template, values)
 * @param {String} template - path and name of the HTML email template file in /server/email/templates
 * @param {Object} values - an object to render dynamic Handlebars values in the template
 * @returns {Object} returns an plain text string with all HTML stripped out
 */
export function renderText(template, values = {}) {
  const html = render(template, values);
  return htmlToText.fromString(html);
}
