export type AuthState =
  | { status: 'loading' }
  | { status: 'anonymous'; isAuthenticated: false }
  | {
      status: 'authenticated';
      isAuthenticated: true;
      playerId: string;
      provider: string;
      displayName: string | null;
      email: string | null;
      authSessionExpiresAt: string | null;
    };

export const AUTH_PLAYER_ID_CHANGED_EVENT = 'authPlayerIdChanged';
