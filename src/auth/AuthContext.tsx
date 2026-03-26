import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getPlayerId, setPlayerId } from '../utils/storage';
import { clearSession } from '../utils/storage';
import { fetchAuthMe, postGoogleSignIn, postSignOut } from '../services/authApi';
import type { AuthState } from './authTypes';
import { AUTH_PLAYER_ID_CHANGED_EVENT } from './authTypes';

type AuthContextValue = {
  auth: AuthState;
  refreshAuthState: () => Promise<void>;
  signInWithGoogleCredential: (credential: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInError: string | null;
  clearSignInError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function meToAuthenticated(
  me: Extract<Awaited<ReturnType<typeof fetchAuthMe>>, { is_authenticated: true }>
): AuthState {
  return {
    status: 'authenticated',
    isAuthenticated: true,
    playerId: me.player_id,
    provider: me.provider,
    displayName: me.display_name ?? null,
    email: me.email ?? null,
    authSessionExpiresAt: me.auth_session_expires_at ?? null,
  };
}

/** Update local player id; clear gameplay session and notify App only when id actually changes. */
function syncPlayerIdFromServer(serverPlayerId: string): void {
  const oldId = getPlayerId();
  setPlayerId(serverPlayerId);
  if (oldId !== null && oldId !== serverPlayerId) {
    clearSession();
    window.dispatchEvent(new CustomEvent(AUTH_PLAYER_ID_CHANGED_EVENT));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });
  const [signInError, setSignInError] = useState<string | null>(null);

  const refreshAuthState = useCallback(async () => {
    try {
      const me = await fetchAuthMe();
      if (me.is_authenticated) {
        syncPlayerIdFromServer(me.player_id);
        setAuth(meToAuthenticated(me));
      } else {
        setAuth({ status: 'anonymous', isAuthenticated: false });
      }
    } catch {
      setAuth({ status: 'anonymous', isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    void refreshAuthState();
  }, [refreshAuthState]);

  const signInWithGoogleCredential = useCallback(async (credential: string) => {
    setSignInError(null);
    try {
      const currentPlayerId = getPlayerId();
      const res = await postGoogleSignIn(credential, currentPlayerId);
      syncPlayerIdFromServer(res.player_id);
      setAuth({
        status: 'authenticated',
        isAuthenticated: true,
        playerId: res.player_id,
        provider: res.provider,
        displayName: res.display_name ?? null,
        email: res.email ?? null,
        authSessionExpiresAt: res.auth_session_expires_at ?? null,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed';
      setSignInError(msg);
    }
  }, []);

  const signOut = useCallback(async () => {
    setSignInError(null);
    try {
      await postSignOut();
      try {
        window.google?.accounts?.id?.disableAutoSelect();
      } catch {
        /* ignore */
      }
      setAuth({ status: 'anonymous', isAuthenticated: false });
    } catch (e) {
      setSignInError(e instanceof Error ? e.message : 'Sign out failed');
    }
  }, []);

  const clearSignInError = useCallback(() => setSignInError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      refreshAuthState,
      signInWithGoogleCredential,
      signOut,
      signInError,
      clearSignInError,
    }),
    [auth, refreshAuthState, signInWithGoogleCredential, signOut, signInError, clearSignInError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
