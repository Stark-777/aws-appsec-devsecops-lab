import express, { type ErrorRequestHandler, type Express, type RequestHandler } from 'express';
import { DocumentService } from '../core/document-service.js';
import type { DocumentRepository } from '../core/document-repository.js';
import { authenticatedSubject, authenticateWith, type IdentityProvider } from './identity.js';
import {
  badRequest,
  contentTooLarge,
  HttpError,
  notFound,
  sendError,
  unsupportedMediaType,
} from './errors.js';
import {
  MAX_RAW_BODY_BYTES,
  parseCreateDocumentBody,
  parseDocumentId,
  requireJsonMediaType,
  requireNoQuery,
} from './validation.js';

export interface AppDependencies {
  identityProvider: IdentityProvider;
  repository: DocumentRepository;
}

const validateCreateHeaders: RequestHandler = (request, _response, next) => {
  try {
    requireNoQuery(request);
    requireJsonMediaType(request);
    next();
  } catch (error) {
    next(error);
  }
};

const handleError: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (error instanceof HttpError) {
    sendError(response, error);
    return;
  }
  const status = (error as { status?: unknown } | null)?.status;
  if (status === 413) {
    sendError(response, contentTooLarge);
  } else if (status === 415) {
    sendError(response, unsupportedMediaType);
  } else if (status === 400) {
    sendError(response, badRequest);
  } else {
    sendError(response, new HttpError(500, 'internal_error', 'Internal server error.'));
  }
};

export function createApp({ identityProvider, repository }: AppDependencies): Express {
  const app = express();
  const service = new DocumentService(repository);
  app.disable('x-powered-by');
  app.disable('etag');
  app.use((_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // Authentication precedes body parsing, ID validation, and query validation.
  app.use('/documents', authenticateWith(identityProvider));

  app.post(
    '/documents',
    validateCreateHeaders,
    express.raw({ type: () => true, limit: MAX_RAW_BODY_BYTES, inflate: false }),
    (request, response) => {
      const content = parseCreateDocumentBody(request.body as unknown);
      const metadata = service.create(authenticatedSubject(response), content);
      response.location(`/documents/${metadata.id}`).status(201).json(metadata);
    },
  );

  app.get('/documents', (request, response) => {
    requireNoQuery(request);
    response.status(200).json(service.list(authenticatedSubject(response)));
  });

  app.get('/documents/:id', (request, response) => {
    requireNoQuery(request);
    const id = parseDocumentId(request.params.id);
    const metadata = service.metadata(authenticatedSubject(response), id);
    if (!metadata) throw notFound;
    response.status(200).json(metadata);
  });

  app.get('/documents/:id/content', (request, response) => {
    requireNoQuery(request);
    const id = parseDocumentId(request.params.id);
    const content = service.content(authenticatedSubject(response), id);
    if (content === undefined) throw notFound;
    response.status(200).type('text/plain').send(content);
  });

  app.delete('/documents/:id', (request, response) => {
    requireNoQuery(request);
    const id = parseDocumentId(request.params.id);
    if (!service.delete(authenticatedSubject(response), id)) throw notFound;
    response.status(204).end();
  });

  app.use(handleError);
  return app;
}
