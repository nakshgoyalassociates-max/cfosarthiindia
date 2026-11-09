import { supabase } from "../supabase/client";

export type OAuthProvider = "google" | "github" | "gitlab" | "bitbucket" | "azure" | "apple";

export type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: OAuthProvider, opts?: SignInOptions) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo:
            opts?.redirect_uri ?? (typeof window !== "undefined" ? window.location.origin : undefined),
          queryParams: opts?.extraParams,
        },
      });

      if (error) {
        return { error, redirected: false };
      }

      return { data, error: null, redirected: true };
    },
  },
};
