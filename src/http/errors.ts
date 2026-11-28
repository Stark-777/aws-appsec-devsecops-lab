import type { Response } from 'express';

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly clientMessage: string,
  ) {
    super(clientMessage);
  }
}

export function sendError(response: Response, error: HttpError): void {
  if (error.status === 401) response.setHeader('WWW-Authenticate', 'Bearer');
  response.status(error.status).json({ code: error.code, message: error.clientMessage });
}

export const unauthorized = new HttpError(401, 'unauthorized', 'Authentication required.');
export const notFound = new HttpError(404, 'not_found', 'Document not found.');
export const badRequest = new HttpError(400, 'bad_request', 'Invalid request.');
export const unsupportedMediaType = new HttpError(415, 'unsupported_media_type', 'Unsupported content type.');
export const contentTooLarge = new HttpError(413, 'content_too_large', 'Document content is too large.');
