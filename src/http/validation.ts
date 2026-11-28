import type { Request } from 'express';
import { badRequest, contentTooLarge, unsupportedMediaType } from './errors.js';

export const MAX_CONTENT_BYTES = 100_000;
export const MAX_RAW_BODY_BYTES = 1_000_000;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const jsonMediaType = /^application\/json(?:\s*;\s*charset=utf-8)?$/i;

export function requireJsonMediaType(request: Request): void {
  if (!jsonMediaType.test(request.get('content-type') ?? '')) throw unsupportedMediaType;
}

export function requireNoQuery(request: Request): void {
  if (Object.keys(request.query).length > 0) throw badRequest;
}

export function parseDocumentId(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw badRequest;
  return value;
}

function hasDuplicateTopLevelKey(json: string): boolean {
  const keys = new Set<string>();
  let objectDepth = 0;
  let arrayDepth = 0;
  let stringStart = -1;
  let escaped = false;

  for (let index = 0; index < json.length; index += 1) {
    const character = json[index];
    if (stringStart >= 0) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === '"') {
        if (objectDepth === 1 && arrayDepth === 0) {
          let next = index + 1;
          while (/\s/.test(json[next] ?? '')) next += 1;
          if (json[next] === ':') {
            const key = JSON.parse(json.slice(stringStart, index + 1)) as string;
            if (keys.has(key)) return true;
            keys.add(key);
          }
        }
        stringStart = -1;
      }
      continue;
    }
    if (character === '"') stringStart = index;
    else if (character === '{') objectDepth += 1;
    else if (character === '}') objectDepth -= 1;
    else if (character === '[') arrayDepth += 1;
    else if (character === ']') arrayDepth -= 1;
  }
  return false;
}

export function parseCreateDocumentBody(rawBody: unknown): string {
  if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) throw badRequest;
  let json: string;
  try {
    json = new TextDecoder('utf-8', { fatal: true }).decode(rawBody);
  } catch {
    throw badRequest;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json) as unknown;
  } catch {
    throw badRequest;
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw badRequest;
  const keys = Object.keys(parsed);
  if (keys.length !== 1 || keys[0] !== 'content' || hasDuplicateTopLevelKey(json)) {
    throw badRequest;
  }
  const content = (parsed as { content: unknown }).content;
  if (typeof content !== 'string' || content.length === 0) throw badRequest;
  if (Buffer.from(content, 'utf8').toString('utf8') !== content) throw badRequest;
  if (Buffer.byteLength(content, 'utf8') > MAX_CONTENT_BYTES) throw contentTooLarge;
  return content;
}
