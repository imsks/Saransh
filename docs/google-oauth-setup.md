# Google OAuth setup

Saransh signs people in with Google. This is the one-time console work that makes
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_URL` and `NEXTAUTH_SECRET` real, so that every
later auth slice has something to point at.

**None of it is code.** It is console clicks and secret handling, and it has to be done by a person
with access to the Google Cloud project and the Vercel project. Nothing in the repository performs
these steps or can verify that they were done — the checklist at the end is the only record.

Saransh gets **its own OAuth client**, not Rajniti's. The two products share a database and a user
row ([ADR 0006](adr/0006-shared-database-and-users.md)), but they are separate origins with separate
consent screens, and sharing one client would mean a change to Rajniti's screen silently changes
Saransh's. The shared `users` row is keyed by the Google account, not by the OAuth client, so two
clients still resolve to one person.

## What the client is for

next-auth owns the Google redirect only. The frontend hands the resulting `id_token` to FastAPI,
which verifies it against Google's JWKS and mints its own token
([ADR 0005](adr/0005-backend-verified-identity.md)). Two consequences for this setup:

- The flow needs **`openid email profile`** and nothing else. Saransh reads no Google API on the
  person's behalf, so no sensitive or restricted scope is involved and the client needs no Google
  verification review.
- The backend will verify that the `id_token`'s audience is **this same client id**. When the
  backend slice lands it needs the client id too, which makes it a shared value rather than a
  frontend-only one. The client *secret* stays with the frontend.

---

## 1. Consent screen

Google Cloud Console → **APIs & Services → OAuth consent screen**, in the same project the API is
deployed from (`GCP_PROJECT_ID`, see [DEPLOYMENT.md](DEPLOYMENT.md)).

| Field | Value |
|---|---|
| User type | **External** — readers are not in a Google Workspace org |
| App name | `Saransh` — this is what the reader sees on the consent screen |
| User support email | A mailbox a reader can actually reach |
| Authorised domain | `vercel.app` (add the custom domain too, once there is one) |
| Developer contact | The maintainer's email; Google sends breaking-change notices here |
| Scopes | `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` — add no others |

**The publishing status is a human decision, and it is the one that bites.** In **Testing**, only
accounts added to the test-user list can sign in; everyone else is refused after the consent screen,
which looks exactly like a broken app. In **Production** anyone can sign in, and because the scopes
are non-sensitive this needs no verification review. Testing is right while auth is being built;
switching to Production is a release step that must happen *before* the pilot, not during it.

## 2. OAuth client

**APIs & Services → Credentials → Create credentials → OAuth client ID**, type **Web application**,
name it something a future maintainer will recognise (`Saransh Web`).

Authorised JavaScript origins:

```
http://localhost:3001
https://saransh-app.vercel.app
```

Authorised redirect URIs — next-auth's callback path, one per origin:

```
http://localhost:3001/api/auth/callback/google
https://saransh-app.vercel.app/api/auth/callback/google
```

Three things that are easy to get wrong here:

- **The port is 3001**, not Next.js's default 3000. Saransh runs on 3001 so it can sit beside
  Rajniti.
- **`localhost` and `127.0.0.1` are different origins to Google.** The registered URI uses
  `localhost` and so does `NEXTAUTH_URL`; browse the app the same way or the redirect is rejected.
- **Vercel preview deployments get a new URL per deploy and cannot be wildcarded.** Sign-in
  therefore does not work on previews unless a stable preview alias is registered as its own
  redirect URI. Previews are left without sign-in rather than carrying a long list of dead URIs.

Copy the client id and secret once. The secret is shown in full only at creation; after that it can
be re-downloaded from the client's page, and if it is ever lost or leaked it is rotated, not
recovered.

## 3. `NEXTAUTH_SECRET`

This is not a Google value. next-auth derives the key that encrypts its session cookie from it, so
it is as sensitive as the client secret, and **each environment gets its own** — sharing one between
local and production means a cookie minted on a laptop is valid in production.

```bash
openssl rand -base64 32
```

## 4. Where the values go

| Variable | Local `frontend/.env` | Vercel (Production) |
|---|---|---|
| `GOOGLE_CLIENT_ID` | from step 2 | same value |
| `GOOGLE_CLIENT_SECRET` | from step 2 | same value |
| `NEXTAUTH_SECRET` | its own value from step 3 | a **different** value from step 3 |
| `NEXTAUTH_URL` | `http://localhost:3001` | `https://saransh-app.vercel.app` |

`NEXTAUTH_URL` is the one that changed with this slice. The earlier guidance was to leave it unset
on Vercel so `getSiteUrl()` would fall back to `VERCEL_URL`; that is wrong for auth, because
`VERCEL_URL` is the per-deployment hostname and will not match a registered redirect URI. Set it to
the stable production origin, which is also the correct canonical URL for SEO.

`frontend/.env` is gitignored and must stay that way. `frontend/.env.example` carries placeholders
only — a real client secret in a tracked file is a public leak, and the gitleaks pre-commit hook is
there to catch the accident, not to be relied on.

## 5. Verify before writing any auth code

Check the client against Google directly, so that a later failure is known to be Saransh's code and
not the provisioning. Put the client id in this URL and open it in a browser:

```
https://accounts.google.com/o/oauth2/v2/auth?client_id=YOUR_CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fapi%2Fauth%2Fcallback%2Fgoogle&response_type=code&scope=openid%20email%20profile
```

A Google account chooser or consent screen naming **Saransh** means the client, the scopes and the
redirect URI are all registered correctly. The failures and what each one means:

| What you see | Cause |
|---|---|
| `Error 401: invalid_client` | Client id wrong, or the client was deleted |
| `Error 400: redirect_uri_mismatch` | The redirect URI is not registered, character for character |
| `Error 403: access_denied` after consent | Publishing status is Testing and this account is not a test user |
| `Error 400: invalid_scope` | A scope was typed in that the consent screen does not list |

The redirect itself will land on a URL that does not serve anything yet. That is expected: the
consent screen is what is being tested, and next-auth's route handler is a later slice.

## Checklist

The console half of this cannot be verified by CI or by an agent, so it is recorded here.

- [ ] OAuth client created in the Saransh Google Cloud project
- [ ] Consent screen has the app name, support email, developer contact and only `openid email profile`
- [ ] Publishing status chosen deliberately, and test users added if it is Testing
- [ ] Both redirect URIs registered (localhost:3001 and the Vercel production origin)
- [ ] `NEXTAUTH_SECRET` generated separately for local and production
- [ ] All four variables set in Vercel Production and in local `frontend/.env`
- [ ] The URL in step 5 returns a consent screen naming Saransh
