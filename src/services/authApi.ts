import { getApiUrl } from '../config/apiConfig';

export type AuthMeResponse =
  | { is_authenticated: false }
  | {
      is_authenticated: true;
      player_id: string;
      provider: string;
      display_name?: string | null;
      email?: string | null;
      auth_session_expires_at?: string | null;
    };

export type GoogleSignInResponse = {
  player_id: string;
  is_authenticated: true;
  provider: string;
  display_name?: string | null;
  email?: string | null;
  auth_session_expires_at?: string | null;
};

const jsonHeaders = { 'Content-Type': 'application/json' };

async function parseError(response: Response): Promise<string> {
  let message = `Server error (${response.status})`;
  try {
    const data = await response.json();
    if (data?.detail) message = typeof data.detail === 'string' ? data.detail : message;
  } catch {
    message = response.statusText || message;
  }
  return message;
}

export async function fetchAuthMe(): Promise<AuthMeResponse> {
  const response = await fetch(getApiUrl('/api/auth/me'), {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function postGoogleSignIn(
  credential: string,
  currentPlayerId: string | null
): Promise<GoogleSignInResponse> {
  const response = await fetch(getApiUrl('/api/auth/google/sign-in'), {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: JSON.stringify({
      credential,
      ...(currentPlayerId ? { current_player_id: currentPlayerId } : {}),
    }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function postSignOut(): Promise<void> {
  const response = await fetch(getApiUrl('/api/auth/sign-out'), {
    method: 'POST',
    credentials: 'include',
    headers: jsonHeaders,
    body: '{}',
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}
