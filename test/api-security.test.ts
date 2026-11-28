import { randomUUID } from 'node:crypto';
import { request as httpRequest, type IncomingHttpHeaders, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { once } from 'node:events';
import { expect } from 'chai';
import { createApp } from '../src/http/app.js';
import { InMemoryDocumentRepository, type StoredDocument } from '../src/core/document-repository.js';

const aliceToken = 'alice-test-token';
const bobToken = 'bob-test-token';
const aliceSubject = 'synthetic-alice';
const bobSubject = 'synthetic-bob';

class TrackingRepository extends InMemoryDocumentRepository {
  created: StoredDocument[] = [];
  contentLoads = 0;
  contentRemovals = 0;

  override create(document: StoredDocument, content: string): void {
    super.create(document, content);
    this.created.push({ ...document });
  }

  protected override loadContent(key: string): string | undefined {
    this.contentLoads += 1;
    return super.loadContent(key);
  }

  protected override removeContent(key: string): void {
    this.contentRemovals += 1;
    super.removeContent(key);
  }
}

interface Reply {
  status: number;
  headers: IncomingHttpHeaders;
  body: string;
  json(): unknown;
}

interface RequestOptions {
  token?: string;
  contentType?: string;
  body?: string | Buffer;
  headers?: Record<string, string>;
}

describe('SecureDocs local API security matrix', () => {
  let server: Server;
  let port: number;
  let repository: TrackingRepository;

  beforeEach(async () => {
    repository = new TrackingRepository();
    const app = createApp({
      repository,
      identityProvider: {
        authenticate: (token) =>
          token === aliceToken ? { subjectId: aliceSubject } :
          token === bobToken ? { subjectId: bobSubject } : undefined,
      },
    });
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    port = (server.address() as AddressInfo).port;
  });

  afterEach(async () => {
    if (!server.listening) return;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  });

  function send(method: string, path: string, options: RequestOptions = {}): Promise<Reply> {
    const headers: Record<string, string> = { ...options.headers };
    if (options.token) headers.Authorization = `Bearer ${options.token}`;
    if (options.contentType) headers['Content-Type'] = options.contentType;
    return new Promise<Reply>((resolve, reject) => {
      const request = httpRequest({ host: '127.0.0.1', port, method, path, headers }, (response) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({
            status: response.statusCode ?? 0,
            headers: response.headers,
            body,
            json: () => JSON.parse(body) as unknown,
          });
        });
        response.on('error', reject);
      });
      request.on('error', reject);
      request.end(options.body);
    });
  }

  function create(token: string, content: string): Promise<Reply> {
    return send('POST', '/documents', {
      token,
      contentType: 'application/json',
      body: JSON.stringify({ content }),
    });
  }

  async function seedBoth(): Promise<{ aliceId: string; bobId: string }> {
    const alice = (await create(aliceToken, 'Alice document')).json() as { id: string };
    const bob = (await create(bobToken, 'Bob document')).json() as { id: string };
    return { aliceId: alice.id, bobId: bob.id };
  }

  it('C01 creates an owner-scoped document with server-generated identifiers and public metadata only', async () => {
    const reply = await create(aliceToken, 'Synthetic notes for Alice.');
    expect(reply.status).to.equal(201);
    const metadata = reply.json() as Record<string, unknown>;
    expect(Object.keys(metadata).sort()).to.deep.equal(['byteSize', 'createdAt', 'id']);
    expect(metadata.id).to.match(/^[0-9a-f-]{36}$/);
    expect(metadata.byteSize).to.equal(Buffer.byteLength('Synthetic notes for Alice.'));
    expect(reply.headers.location).to.equal(`/documents/${metadata.id}`);
    expect(reply.headers['cache-control']).to.equal('no-store');
    expect(reply.headers['x-content-type-options']).to.equal('nosniff');
    expect(reply.headers.etag).to.be.undefined;
    expect(repository.created[0]?.ownerId).to.equal(aliceSubject);
    expect(repository.created[0]?.storageKey).to.match(/^documents\/[0-9a-f-]{36}$/);
    expect(repository.findByOwner(bobSubject, metadata.id as string)).to.be.undefined;
  });

  it('C02 rejects missing authentication before parsing and creates nothing', async () => {
    const reply = await send('POST', '/documents', { contentType: 'application/json', body: '{' });
    expect(reply.status).to.equal(401);
    expect(reply.headers['www-authenticate']).to.equal('Bearer');
    expect(repository.created).to.have.length(0);
  });

  it('C03 rejects unknown synthetic bearer tokens; real JWT claims remain untested', async () => {
    const reply = await send('POST', '/documents', {
      token: 'invalid-test-token', contentType: 'application/json', body: '{"content":"x"}',
    });
    expect(reply.status).to.equal(401);
    expect(repository.created).to.have.length(0);
  });

  it('C04 rejects each client-controlled ownership or storage field', async () => {
    for (const field of ['ownerId', 'role', 'storageKey']) {
      const reply = await send('POST', '/documents', {
        token: aliceToken, contentType: 'application/json',
        body: JSON.stringify({ content: 'safe', [field]: 'synthetic-bob' }),
      });
      expect(reply.status, field).to.equal(400);
    }
    expect(repository.created).to.have.length(0);
  });

  it('C05 rejects missing and unsupported content types', async () => {
    for (const contentType of [undefined, 'text/plain', 'application/xml']) {
      const reply = await send('POST', '/documents', {
        token: aliceToken, body: Buffer.from('{"content":"safe"}'),
        ...(contentType ? { contentType } : {}),
      });
      expect(reply.status, String(contentType)).to.equal(415);
    }
    expect(repository.created).to.have.length(0);
  });

  it('C06 rejects decoded ASCII and multibyte content beyond 100,000 bytes', async () => {
    for (const content of ['a'.repeat(100_001), 'a'.repeat(99_997) + '😀']) {
      const reply = await create(aliceToken, content);
      expect(reply.status).to.equal(413);
    }
    expect(repository.created).to.have.length(0);
  });

  it('C07 rejects empty, malformed, duplicate-key, invalid UTF-8, and lone-surrogate bodies', async () => {
    const bodies = [
      Buffer.from('{"content":""}'),
      Buffer.from('{"content":'),
      Buffer.from('{"content":"one","content":"two"}'),
      Buffer.from('{"content":"one","cont\\u0065nt":"two"}'),
      Buffer.from([0xc3, 0x28]),
      Buffer.from('{"content":"\\ud800"}'),
    ];
    for (const body of bodies) {
      const reply = await send('POST', '/documents', { token: aliceToken, contentType: 'application/json', body });
      expect(reply.status, body.toString('hex').slice(0, 24)).to.equal(400);
    }
    expect(repository.created).to.have.length(0);
  });

  it('C08 accepts the exact UTF-8 boundary, including escaped JSON text', async () => {
    const content = 'a'.repeat(99_996) + '😀';
    const reply = await create(aliceToken, content);
    expect(reply.status).to.equal(201);
    expect((reply.json() as { byteSize: number }).byteSize).to.equal(100_000);
    const escaped = await send('POST', '/documents', {
      token: aliceToken, contentType: 'application/json',
      body: `{"content":"${'\\u0061'.repeat(100_000)}"}`,
    });
    expect(escaped.status).to.equal(201);
    expect((escaped.json() as { byteSize: number }).byteSize).to.equal(100_000);
  });

  it('L01 returns only Alice metadata from an owner-scoped repository query', async () => {
    const { aliceId, bobId } = await seedBoth();
    const reply = await send('GET', '/documents', { token: aliceToken });
    expect(reply.status).to.equal(200);
    expect(reply.json()).to.deep.equal([{
      id: aliceId, byteSize: 14, createdAt: repository.findByOwner(aliceSubject, aliceId)?.createdAt,
    }]);
    expect(reply.body).not.to.include(bobId);
    expect(reply.body).not.to.include('storageKey');
  });

  it('L02 returns only Bob metadata', async () => {
    const { aliceId, bobId } = await seedBoth();
    const reply = await send('GET', '/documents', { token: bobToken });
    expect(reply.status).to.equal(200);
    expect((reply.json() as { id: string }[]).map((item) => item.id)).to.deep.equal([bobId]);
    expect(reply.body).not.to.include(aliceId);
  });

  it('L03 returns an empty list for an owner with no documents', async () => {
    const reply = await send('GET', '/documents', { token: aliceToken });
    expect(reply.status).to.equal(200);
    expect(reply.json()).to.deep.equal([]);
  });

  it('L04 rejects missing and invalid authentication', async () => {
    for (const token of [undefined, 'wrong']) {
      const reply = await send('GET', '/documents', token ? { token } : {});
      expect(reply.status).to.equal(401);
      expect(reply.body).not.to.include('documents');
    }
  });

  it('L05 rejects owner, role, and storage key query selectors', async () => {
    await seedBoth();
    for (const query of ['ownerId=synthetic-bob', 'role=admin', 'storageKey=documents%2Ffake']) {
      const reply = await send('GET', `/documents?${query}`, { token: aliceToken });
      expect(reply.status, query).to.equal(400);
      expect(reply.body).not.to.include('Bob document');
    }
  });

  it('M01 returns only public metadata to the owner', async () => {
    const { aliceId } = await seedBoth();
    const reply = await send('GET', `/documents/${aliceId}`, { token: aliceToken });
    expect(reply.status).to.equal(200);
    expect(Object.keys(reply.json() as object).sort()).to.deep.equal(['byteSize', 'createdAt', 'id']);
  });

  it('M02 gives Bob the same 404 body as a missing metadata document', async () => {
    const { aliceId } = await seedBoth();
    const denied = await send('GET', `/documents/${aliceId}`, { token: bobToken });
    const missing = await send('GET', `/documents/${randomUUID()}`, { token: bobToken });
    expect(denied.status).to.equal(404);
    expect(denied.body).to.equal(missing.body);
  });

  it('M03 returns the generic 404 for a nonexistent valid UUID', async () => {
    const reply = await send('GET', `/documents/${randomUUID()}`, { token: aliceToken });
    expect(reply.status).to.equal(404);
    expect(reply.json()).to.deep.equal({ code: 'not_found', message: 'Document not found.' });
  });

  it('M04 gives 401 precedence over malformed ID validation', async () => {
    for (const token of [undefined, 'wrong']) {
      const reply = await send('GET', '/documents/not-a-uuid', token ? { token } : {});
      expect(reply.status).to.equal(401);
    }
  });

  it('M05 rejects malformed IDs after authentication', async () => {
    const reply = await send('GET', '/documents/not-a-uuid', { token: aliceToken });
    expect(reply.status).to.equal(400);
  });

  it('R01 returns only owner content with text and security headers', async () => {
    const created = await create(aliceToken, 'private synthetic text');
    const id = (created.json() as { id: string }).id;
    const reply = await send('GET', `/documents/${id}/content`, { token: aliceToken });
    expect(reply.status).to.equal(200);
    expect(reply.body).to.equal('private synthetic text');
    expect(reply.headers['content-type']).to.equal('text/plain; charset=utf-8');
    expect(reply.headers['cache-control']).to.equal('no-store');
    expect(reply.headers['x-content-type-options']).to.equal('nosniff');
    expect(reply.headers.etag).to.be.undefined;
  });

  it('R02 denies Bob without loading Alice content and matches missing 404', async () => {
    const { aliceId } = await seedBoth();
    const denied = await send('GET', `/documents/${aliceId}/content`, { token: bobToken });
    const missing = await send('GET', `/documents/${randomUUID()}/content`, { token: bobToken });
    expect(denied.status).to.equal(404);
    expect(denied.body).to.equal(missing.body);
    expect(repository.contentLoads).to.equal(0);
  });

  it('R03 does not read storage for a missing document', async () => {
    const reply = await send('GET', `/documents/${randomUUID()}/content`, { token: aliceToken });
    expect(reply.status).to.equal(404);
    expect(repository.contentLoads).to.equal(0);
  });

  it('R04 denies missing and invalid credentials before any content read', async () => {
    const { aliceId } = await seedBoth();
    for (const token of [undefined, 'wrong']) {
      const reply = await send('GET', `/documents/${aliceId}/content`, token ? { token } : {});
      expect(reply.status).to.equal(401);
    }
    expect(repository.contentLoads).to.equal(0);
  });

  it('R05 rejects malformed IDs without reading content', async () => {
    const reply = await send('GET', '/documents/not-a-uuid/content', { token: aliceToken });
    expect(reply.status).to.equal(400);
    expect(repository.contentLoads).to.equal(0);
  });

  it('D01 lets Alice delete her document and removes metadata and content', async () => {
    const { aliceId } = await seedBoth();
    const reply = await send('DELETE', `/documents/${aliceId}`, { token: aliceToken });
    expect(reply.status).to.equal(204);
    expect(reply.body).to.equal('');
    expect(repository.contentRemovals).to.equal(1);
    expect((await send('GET', `/documents/${aliceId}`, { token: aliceToken })).status).to.equal(404);
    expect((await send('GET', `/documents/${aliceId}/content`, { token: aliceToken })).status).to.equal(404);
  });

  it('D02 denies Bob deletion and preserves Alice metadata and bytes', async () => {
    const { aliceId } = await seedBoth();
    const denied = await send('DELETE', `/documents/${aliceId}`, { token: bobToken });
    expect(denied.status).to.equal(404);
    expect(repository.contentRemovals).to.equal(0);
    expect((await send('GET', `/documents/${aliceId}`, { token: aliceToken })).status).to.equal(200);
    expect((await send('GET', `/documents/${aliceId}/content`, { token: aliceToken })).body).to.equal('Alice document');
  });

  it('D03 uses the same 404 body for absent and other-owner deletion', async () => {
    const { aliceId } = await seedBoth();
    const missing = await send('DELETE', `/documents/${randomUUID()}`, { token: bobToken });
    const denied = await send('DELETE', `/documents/${aliceId}`, { token: bobToken });
    expect(missing.status).to.equal(404);
    expect(missing.body).to.equal(denied.body);
    expect(repository.contentRemovals).to.equal(0);
  });

  it('D04 rejects unauthenticated deletion with no mutation', async () => {
    const { aliceId } = await seedBoth();
    for (const token of [undefined, 'wrong']) {
      const reply = await send('DELETE', `/documents/${aliceId}`, token ? { token } : {});
      expect(reply.status).to.equal(401);
    }
    expect(repository.contentRemovals).to.equal(0);
    expect((await send('GET', `/documents/${aliceId}`, { token: aliceToken })).status).to.equal(200);
  });

  it('D05 rejects malformed ID deletion with no mutation', async () => {
    const reply = await send('DELETE', '/documents/not-a-uuid', { token: aliceToken });
    expect(reply.status).to.equal(400);
    expect(repository.contentRemovals).to.equal(0);
  });

  it('rejects a raw body above the separate 1,000,000-byte cap without creating data', async () => {
    const reply = await send('POST', '/documents', {
      token: aliceToken, contentType: 'application/json', body: Buffer.alloc(1_000_001, 0x61),
    });
    expect(reply.status).to.equal(413);
    expect(repository.created).to.have.length(0);
  });

  it('ignores client identity headers and rejects duplicated Authorization headers', async () => {
    const forged = await send('GET', '/documents', { headers: { 'X-User-Id': aliceSubject } });
    expect(forged.status).to.equal(401);
    const duplicated = await new Promise<number>((resolve, reject) => {
      const request = httpRequest({
        host: '127.0.0.1', port, method: 'GET', path: '/documents',
        headers: { Authorization: [`Bearer ${aliceToken}`, `Bearer ${bobToken}`] },
      }, (response) => { response.resume(); resolve(response.statusCode ?? 0); });
      request.on('error', reject);
      request.end();
    });
    expect(duplicated).to.equal(401);
  });

  it('never exposes storage keys, owner IDs, or stack traces in error bodies', async () => {
    const reply = await send('POST', '/documents', {
      token: aliceToken, contentType: 'application/json', body: '{"content":',
    });
    expect(reply.status).to.equal(400);
    expect(Object.keys(reply.json() as object).sort()).to.deep.equal(['code', 'message']);
    for (const secret of ['storageKey', 'ownerId', aliceSubject, 'Error:', ' at ']) {
      expect(reply.body).not.to.include(secret);
    }
  });
});
