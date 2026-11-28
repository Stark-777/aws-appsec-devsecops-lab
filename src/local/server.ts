import { createApp } from '../http/app.js';
import { InMemoryDocumentRepository } from '../core/document-repository.js';
import { createLocalIdentityProvider } from './identity.js';

const aliceToken = process.env.SECUREDOCS_ALICE_TOKEN;
const bobToken = process.env.SECUREDOCS_BOB_TOKEN;
if (!aliceToken || !bobToken) {
  throw new Error('Set distinct local synthetic bearer tokens in SECUREDOCS_ALICE_TOKEN and SECUREDOCS_BOB_TOKEN');
}

const port = Number(process.env.SECUREDOCS_PORT ?? '3000');
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('SECUREDOCS_PORT must be an integer between 1 and 65535');
}

const app = createApp({
  identityProvider: createLocalIdentityProvider(aliceToken, bobToken),
  repository: new InMemoryDocumentRepository(),
});
app.listen(port, '127.0.0.1', () => {
  process.stdout.write(`SecureDocs local API listening on http://127.0.0.1:${port}\n`);
});
