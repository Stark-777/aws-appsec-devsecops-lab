import { randomUUID } from 'node:crypto';
import { expect } from 'chai';
import { DocumentService } from '../src/core/document-service.js';
import { InMemoryDocumentRepository, type StoredDocument } from '../src/core/document-repository.js';

class TrackedRepository extends InMemoryDocumentRepository {
  lastCreated: StoredDocument | undefined;
  loads = 0;
  removals = 0;

  override create(document: StoredDocument, content: string): void {
    this.lastCreated = { ...document };
    super.create(document, content);
  }

  protected override loadContent(key: string): string | undefined {
    this.loads += 1;
    return super.loadContent(key);
  }

  protected override removeContent(key: string): void {
    this.removals += 1;
    super.removeContent(key);
  }
}

describe('owner-scoped document repository and service', () => {
  it('generates internal identifiers and keeps owner and storage key out of public metadata', () => {
    const repository = new TrackedRepository();
    const service = new DocumentService(repository);
    const metadata = service.create('synthetic-alice', 'text');
    expect(metadata.id).to.match(/^[0-9a-f-]{36}$/);
    expect(Object.keys(metadata).sort()).to.deep.equal(['byteSize', 'createdAt', 'id']);
    expect(repository.lastCreated?.ownerId).to.equal('synthetic-alice');
    expect(repository.lastCreated?.storageKey).to.match(/^documents\/[0-9a-f-]{36}$/);
    expect(repository.lastCreated?.storageKey).not.to.include(metadata.id);
  });

  it('never loads content or removes data for a different owner or missing UUID', () => {
    const repository = new TrackedRepository();
    const service = new DocumentService(repository);
    const metadata = service.create('synthetic-alice', 'private');
    expect(service.content('synthetic-bob', metadata.id)).to.be.undefined;
    expect(service.content('synthetic-alice', randomUUID())).to.be.undefined;
    expect(service.delete('synthetic-bob', metadata.id)).to.equal(false);
    expect(service.delete('synthetic-alice', randomUUID())).to.equal(false);
    expect(repository.loads).to.equal(0);
    expect(repository.removals).to.equal(0);
    expect(service.content('synthetic-alice', metadata.id)).to.equal('private');
  });

  it('uses the owner index for list isolation and removes only the authorized record', () => {
    const repository = new TrackedRepository();
    const service = new DocumentService(repository);
    const alice = service.create('synthetic-alice', 'A');
    const bob = service.create('synthetic-bob', 'B');
    expect(service.list('synthetic-alice').map((item) => item.id)).to.deep.equal([alice.id]);
    expect(service.list('synthetic-bob').map((item) => item.id)).to.deep.equal([bob.id]);
    expect(service.delete('synthetic-alice', alice.id)).to.equal(true);
    expect(repository.removals).to.equal(1);
    expect(service.list('synthetic-alice')).to.deep.equal([]);
    expect(service.content('synthetic-bob', bob.id)).to.equal('B');
  });
});
