import { access, appendFile } from 'node:fs/promises';
import chromeWebstoreUpload from 'chrome-webstore-upload';
import manifest from '../manifest.json' with { type: 'json' };
import { errorMessages, publishExtension } from './cws-publication.mjs';

try {
  const [argument, extra] = process.argv.slice(2);
  if (!argument || extra) throw new Error('Usage: node scripts/publish-cws.mjs <extension.zip | --status>');
  for (const name of ['EXTENSION_ID', 'PUBLISHER_ID', 'CLIENT_ID', 'CLIENT_SECRET', 'REFRESH_TOKEN']) {
    if (!process.env[name]?.trim()) throw new Error(`Missing required environment variable ${name}.`);
  }
  const statusOnly = argument === '--status';
  if (!statusOnly) await access(argument);
  const messages = [];
  await publishExtension({
    client: chromeWebstoreUpload({
      extensionId: process.env.EXTENSION_ID,
      publisherId: process.env.PUBLISHER_ID,
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      refreshToken: process.env.REFRESH_TOKEN,
    }),
    version: manifest.version,
    zipPath: statusOnly ? undefined : argument,
    statusOnly,
    log: message => { console.log(message); messages.push(message); },
  });
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `\n### Chrome Web Store\n\n\`\`\`text\n${messages.join('\n')}\n\`\`\`\n`);
  }
} catch (error) {
  for (let message of errorMessages(error)) {
    for (const name of ['CLIENT_ID', 'CLIENT_SECRET', 'REFRESH_TOKEN']) {
      if (process.env[name]) message = message.replaceAll(process.env[name], '[redacted]');
    }
    console.error(message);
  }
  process.exitCode = 1;
}
