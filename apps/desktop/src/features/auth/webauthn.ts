import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import type { LoginResponse } from '@erp/shared';
import { apiFetch } from '@/lib/api';

export function fingerprintSupported(): boolean {
  return browserSupportsWebAuthn();
}

/** Enrolls this device's fingerprint / Windows Hello for the logged-in user. */
export async function enrollFingerprint(): Promise<void> {
  const optionsJSON = await apiFetch<PublicKeyCredentialCreationOptionsJSON>(
    '/auth/webauthn/register/options',
    { method: 'POST', body: '{}' },
  );
  const attResp = await startRegistration({ optionsJSON });
  await apiFetch('/auth/webauthn/register/verify', {
    method: 'POST',
    body: JSON.stringify(attResp),
  });
}

/** Authenticates with a fingerprint for the given email. */
export async function loginWithFingerprint(email: string): Promise<LoginResponse> {
  const optionsJSON = await apiFetch<PublicKeyCredentialRequestOptionsJSON>(
    '/auth/webauthn/login/options',
    { method: 'POST', body: JSON.stringify({ email }) },
  );
  const asseResp = await startAuthentication({ optionsJSON });
  return apiFetch<LoginResponse>('/auth/webauthn/login/verify', {
    method: 'POST',
    body: JSON.stringify({ email, response: asseResp }),
  });
}
