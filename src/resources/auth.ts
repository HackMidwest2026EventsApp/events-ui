/** The session context and the hook that reads it.
 *
 * Separate from the provider component so this file exports no component:
 * mixing the two breaks fast refresh (react-refresh/only-export-components).
 */
import { createContext, useContext } from "react";
import type { Me } from "./AccountModel";

export interface AuthValue {
  /** Null while signed out, including when a stored token turned out dead. */
  token: string | null;
  user: Me | undefined;
  /** A token exists but /auth/me has not answered yet. */
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthValue | null>(null);

export const useAuth = (): AuthValue => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside an AuthProvider");
  return value;
};
