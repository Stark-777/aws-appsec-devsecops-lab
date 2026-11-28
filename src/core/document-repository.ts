export interface DocumentMetadata {
  id: string;
  byteSize: number;
  createdAt: string;
}

export interface StoredDocument extends DocumentMetadata {
  ownerId: string;
  storageKey: string;
}

export interface DocumentRepository {
  create(document: StoredDocument, content: string): void;
  listByOwner(ownerId: string): DocumentMetadata[];
  findByOwner(ownerId: string, id: string): DocumentMetadata | undefined;
  readContentByOwner(ownerId: string, id: string): string | undefined;
  deleteByOwner(ownerId: string, id: string): boolean;
}

function publicMetadata(document: StoredDocument): DocumentMetadata {
  return {
    id: document.id,
    byteSize: document.byteSize,
    createdAt: document.createdAt,
  };
}

export class InMemoryDocumentRepository implements DocumentRepository {
  private readonly documents = new Map<string, StoredDocument>();
  private readonly contentByKey = new Map<string, string>();
  private readonly idsByOwner = new Map<string, Set<string>>();

  create(document: StoredDocument, content: string): void {
    if (this.documents.has(document.id) || this.contentByKey.has(document.storageKey)) {
      throw new Error('Generated document identifier collision');
    }
    this.documents.set(document.id, { ...document });
    this.contentByKey.set(document.storageKey, content);
    const ownerIds = this.idsByOwner.get(document.ownerId) ?? new Set<string>();
    ownerIds.add(document.id);
    this.idsByOwner.set(document.ownerId, ownerIds);
  }

  listByOwner(ownerId: string): DocumentMetadata[] {
    const ids = this.idsByOwner.get(ownerId);
    if (!ids) return [];
    return [...ids].flatMap((id) => {
      const document = this.documents.get(id);
      return document && document.ownerId === ownerId ? [publicMetadata(document)] : [];
    });
  }

  findByOwner(ownerId: string, id: string): DocumentMetadata | undefined {
    const document = this.ownedDocument(ownerId, id);
    return document ? publicMetadata(document) : undefined;
  }

  readContentByOwner(ownerId: string, id: string): string | undefined {
    const document = this.ownedDocument(ownerId, id);
    if (!document) return undefined;
    return this.loadContent(document.storageKey);
  }

  deleteByOwner(ownerId: string, id: string): boolean {
    const document = this.ownedDocument(ownerId, id);
    if (!document) return false;
    this.removeContent(document.storageKey);
    this.documents.delete(id);
    const ownerIds = this.idsByOwner.get(ownerId);
    ownerIds?.delete(id);
    if (ownerIds?.size === 0) this.idsByOwner.delete(ownerId);
    return true;
  }

  protected loadContent(storageKey: string): string | undefined {
    return this.contentByKey.get(storageKey);
  }

  protected removeContent(storageKey: string): void {
    this.contentByKey.delete(storageKey);
  }

  private ownedDocument(ownerId: string, id: string): StoredDocument | undefined {
    const document = this.documents.get(id);
    return document?.ownerId === ownerId ? document : undefined;
  }
}
