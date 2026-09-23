/**
 * Cookie names, shared by the Auth.js config and the proxy so the two cannot
 * drift apart. Renaming them is branding, not security — the session is only
 * as safe as AUTH_SECRET, which signs and encrypts its contents.
 *
 * The `__Secure-` and `__Host-` prefixes are enforced by the browser: it will
 * reject such a cookie unless it is Secure (and, for `__Host-`, path=/ with no
 * Domain). They only work over HTTPS, hence the dev/prod split.
 */
const useSecureCookies = process.env.NODE_ENV === "production";

export const SESSION_COOKIE = useSecureCookies
  ? "__Secure-et.session"
  : "et.session";
export const CSRF_COOKIE = useSecureCookies ? "__Host-et.csrf" : "et.csrf";
export const CALLBACK_COOKIE = useSecureCookies
  ? "__Secure-et.callback"
  : "et.callback";

export const authCookies = {
  sessionToken: {
    name: SESSION_COOKIE,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: useSecureCookies,
    },
  },
  csrfToken: {
    name: CSRF_COOKIE,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: useSecureCookies,
    },
  },
  callbackUrl: {
    name: CALLBACK_COOKIE,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: useSecureCookies,
    },
  },
} as const;
