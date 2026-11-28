import { randomUUID } from 'node:crypto';
import type { DocumentMetadata, DocumentRepository, StoredDocument } from './document-repository.js';

export class DocumentService {
  constructor(private readonly repository: DocumentRepository) {}

  create(ownerId: string, content: string): DocumentMetadata {
    const document: StoredDocument = {
      id: randomUUID(),
      ownerId,
      storageKey: `documents/${randomUUID()}`,
      byteSize: Buffer.byteLength(content, 'utf8'),
      createdAt: new Date().toISOString(),
    };
    this.repository.create(document, content);
    return { id: document.id, byteSize: document.byteSize, createdAt: document.createdAt };
  }

  list(ownerId: string): DocumentMetadata[] {
    return this.repository.listByOwner(ownerId);
  }

  metadata(ownerId: string, id: string): DocumentMetadata | undefined {
    return this.repository.findByOwner(ownerId, id);
  }

  content(ownerId: string, id: string): string | undefined {
    return this.repository.readContentByOwner(ownerId, id);
  }

  delete(ownerId: string, id: string): boolean {
    return this.repository.deleteByOwner(ownerId, id);
  }
}
