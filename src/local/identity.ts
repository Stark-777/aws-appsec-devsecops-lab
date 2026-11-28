import type { IdentityProvider, Principal } from '../http/identity.js';

const alice: Principal = { subjectId: 'synthetic-alice' };
const bob: Principal = { subjectId: 'synthetic-bob' };

export function createLocalIdentityProvider(aliceToken: string, bobToken: string): IdentityProvider {
  if (aliceToken.length < 32 || bobToken.length < 32 || aliceToken === bobToken) {
    throw new Error('Local synthetic tokens must be distinct and at least 32 characters');
  }
  const identities = new Map<string, Principal>([
    [aliceToken, alice],
    [bobToken, bob],
  ]);
  return { authenticate: (token) => identities.get(token) };
}
