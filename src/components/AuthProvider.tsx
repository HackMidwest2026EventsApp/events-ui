/** Who is signed in, for the whole app.
 *
 * Signing in is optional everywhere except the profile: event discovery and
 * outfit advice both work signed out (the backend keeps a guest path for
 * them). An account is what makes a saved event *yours* and so is what the
 * "I'm going" list needs.
 */
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api, readToken, writeToken } from "../resources/api";
import { AuthContext, type AuthValue } from "../resources/auth";
import type { Me, Token } from "../resources/AccountModel";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [stored, setStored] = useState<string | null>(readToken);
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<Me>({
    queryKey: ["me", stored],
    enabled: stored !== null,
    staleTime: 60_000,
    retry: false,
    queryFn: async () => {
      try {
        return await api<Me>("/api/v1/auth/me", { token: stored });
      } catch (cause) {
        // Tokens last a day. One the API rejects is dead, so take it out of
        // storage here -- the next page load then starts signed out.
        if (cause instanceof ApiError && cause.status === 401) writeToken(null);
        throw cause;
      }
    },
  });

  // Derived rather than cleared in an effect: a rejected token is simply not a
  // session, and the header reads this instead of a second piece of state.
  const rejected = error instanceof ApiError && error.status === 401;
  const token = rejected ? null : stored;

  const signOut = useCallback(() => {
    writeToken(null);
    setStored(null);
    // Saved events, preferences and location were all fetched as someone else.
    queryClient.removeQueries({ queryKey: ["me"] });
    queryClient.removeQueries({ queryKey: ["savedEvents"] });
    queryClient.removeQueries({ queryKey: ["preferences"] });
    queryClient.removeQueries({ queryKey: ["location"] });
  }, [queryClient]);

  const accept = useCallback((issued: Token) => {
    writeToken(issued.access_token);
    setStored(issued.access_token);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      token,
      user: token ? user : undefined,
      isLoading: token !== null && isLoading,
      signIn: async (email, password) =>
        accept(
          await api<Token>("/api/v1/auth/login", {
            // OAuth2PasswordRequestForm: form-encoded, with the email in
            // `username`.
            form: { username: email, password },
          }),
        ),
      signUp: async (email, password) =>
        accept(
          await api<Token>("/api/v1/auth/register", {
            body: { email, password },
          }),
        ),
      signOut,
    }),
    [token, user, isLoading, accept, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
