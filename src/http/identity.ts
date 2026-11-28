import type { Request, RequestHandler } from 'express';
import { sendError, unauthorized } from './errors.js';

export interface Principal {
  subjectId: string;
}

export interface IdentityProvider {
  authenticate(bearerToken: string): Principal | undefined | Promise<Principal | undefined>;
}

function bearerToken(request: Request): string | undefined {
  let authorizationHeaders = 0;
  for (let index = 0; index < request.rawHeaders.length; index += 2) {
    if (request.rawHeaders[index]?.toLowerCase() === 'authorization') authorizationHeaders += 1;
  }
  if (authorizationHeaders !== 1) return undefined;
  const match = /^Bearer ([^\s]+)$/.exec(request.get('authorization') ?? '');
  return match?.[1];
}

export function authenticateWith(provider: IdentityProvider): RequestHandler {
  return async (request, response, next) => {
    const token = bearerToken(request);
    if (!token) {
      sendError(response, unauthorized);
      return;
    }
    try {
      const principal = await provider.authenticate(token);
      if (!principal?.subjectId) {
        sendError(response, unauthorized);
        return;
      }
      response.locals.principal = principal;
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function authenticatedSubject(response: { locals: Record<string, unknown> }): string {
  const principal = response.locals.principal as Principal | undefined;
  if (!principal?.subjectId) throw new Error('Authentication middleware was not applied');
  return principal.subjectId;
}
