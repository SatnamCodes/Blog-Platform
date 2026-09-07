# Blog Platform — Markdown Editor & CMS

A full-stack blog platform: Express/Mongoose API + JWT auth, and a Vite/React
client with a markdown editor, live preview, nested comments, tags, search,
bookmarks, and an author dashboard.

## Stack

- **Client**: Vite, React 18, React Router v6, Tailwind CSS (+ typography
  plugin), Zustand, react-hook-form, react-markdown + remark-gfm +
  rehype-highlight, DOMPurify, react-helmet-async.
- **Server**: Express, Mongoose/MongoDB, JWT (access + refresh), zod,
  Cloudinary SDK, express-rate-limit, jsdom + DOMPurify (server-side
  sanitization), Vitest + Supertest + mongodb-memory-server for tests.

## Running locally

```bash
npm run install:all      # installs server + client deps
cp server/.env.example server/.env   # then fill in real secrets
cp client/.env.example client/.env

# Terminal 1: MongoDB (a local mongod, or see "no MongoDB" note below)
mongod --dbpath /some/data/dir

# Terminal 2
npm run dev:server       # http://localhost:5000

# Terminal 3
npm run dev:client       # http://localhost:5173
```

Optional: `npm run seed` populates a demo author (`demo.author@example.com`
/ `password123`) with a couple of sample posts. **Not run automatically** —
the app works fine against a completely empty database on first run.

### Running with Docker

```bash
docker compose up --build
```

Brings up MongoDB, the API (port 5000), and an nginx-served client build
(port 5173). Set `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` in your shell
or a `.env` file at the repo root before running in anything but local dev.

## Schema design decisions

- **Slug generation & collisions** (`server/src/utils/slugify.js`): slugs are
  always generated server-side, never trusted from the client. On title
  create/change we slugify the title, then run a *loop* that queries all
  existing slugs sharing that base (`^base(-\d+)?$`) in one query, and picks
  the lowest free `-N` suffix. A single "does this slug exist" check is not
  enough — if `my-post` and `my-post-2` both already exist, a naive check
  against only the base slug would produce `my-post-2` again. The loop reads
  the full set of same-base slugs once, then increments in memory until it
  finds a gap, so it handles arbitrary numbers of prior collisions correctly
  in one round trip. Edits pass `excludeId` so renaming a post back to a
  slug that only that same post currently owns doesn't spuriously bump it.

- **`parentComment` self-reference** (`server/src/models/Comment.js`): a
  reply is structurally just "a comment whose parent is another comment," so
  one collection with a nullable self-referencing field models a comment
  tree of arbitrary depth without a separate `Reply` model or a hardcoded
  depth limit. The `/api/comments/post/:postId` route fetches the flat list
  for a post and builds the nested tree in application code (`buildTree`),
  which keeps the schema and indexes simple (a single `post` + `parentComment`
  index) while still supporting unlimited nesting on the client.

- **`wordCount` / `readingTime` computed server-side**
  (`server/src/utils/content.js`): both are derived purely from `content`
  (`readingTime = ceil(wordCount / 200)`), and are recomputed on every save
  server-side rather than accepted from the client. A client-supplied value
  here would be trivially spoofable (e.g. a post claiming "1 min read" that's
  actually 6,000 words) and would drift out of sync the moment content
  changed without a corresponding client recalculation. Recomputing
  server-side on save guarantees the two numbers are always consistent with
  the stored content, for every client that ever writes a post.

## Auth & routing decisions

- **Access token in memory, refresh token in an httpOnly cookie**
  (`client/src/store/authStore.js`, `server/src/utils/tokens.js`): the access
  token is short-lived (15m) and kept only in a Zustand store in memory —
  never `localStorage` — so an XSS payload that can run JS still can't read
  it out of storage; the worst case is a leaked token valid for minutes, not
  indefinitely. The refresh token lives in an `httpOnly` (client JS can't
  read it at all), `sameSite` cookie scoped to `/api/auth`, so a compromised
  page can't silently mint new access tokens either. The tradeoff: a hard
  page refresh loses the in-memory access token, which is why `App.jsx`
  calls `/auth/refresh` once on mount to silently restore the session from
  the cookie.

- **`requireRole` middleware exists with no admin routes using it yet**
  (`server/src/middleware/auth.js`): the `User.role` enum already includes
  `admin` and `requireRole(...roles)` is fully implemented and documented,
  even though no route in this base project uses it. This is a deliberate
  extension point — adding an admin-only route later is
  `router.get('/x', requireAuth, requireRole('admin'), handler)` with zero
  changes to the auth/session plumbing, rather than bolting role checks on
  after the fact.

- **Two-layer markdown sanitization**: the server strips raw HTML tags out
  of markdown content on save (`server/src/utils/sanitize.js`, DOMPurify run
  against a jsdom window), and the client sanitizes the *rendered* HTML
  output of `react-markdown` again before it reaches the DOM
  (`client/src/lib/markdown.js`). Two independent layers so a bug or bypass
  in either one alone doesn't mean an unsanitized `<script>` tag survives
  end to end — see `server/tests/security.test.js` for a passing test that
  submits a post containing `<script>alert(1)</script>` and asserts it never
  reaches storage.

## Verification actually run

All of the following were executed for real in this environment (not
simulated) except where noted.

- `npm install` in both `server/` and `client/` — succeeded.
- `npx eslint .` in both `server/` and `client/` — zero errors/warnings after
  fixes (unused vars, missing JSX parser config, redundant eslint-disable
  comments).
- `npx vitest run` in `server/` — **3/3 tests pass**, including
  `tests/security.test.js` (the XSS sanitization test) and
  `tests/slug.test.js` (slug collision loop, edit-exclusion).
- `npx vite build` in `client/` — succeeds; output shows `Editor-*.js` and
  `Dashboard-*.js` as separate chunks from `index-*.js`/`vendor-*.js`,
  confirming the `React.lazy` route-level code splitting for the editor and
  dashboard routes actually takes effect in a production build.
- Server started against a real (embedded) MongoDB instance via
  `mongodb-memory-server` — **no standalone `mongod`/Atlas cluster is
  reachable in this sandbox**, so this is the one substitution made; it runs
  a real MongoDB binary, not a mock, so all Mongoose behavior (indexes,
  aggregation, text search) is exercised for real.
- `GET /api/health` → `200 {"status":"ok",...}`.
- Vite client dev server started and served `200` on `/`.
- Full curl round trip: register → login → create draft post → duplicate
  title (confirmed `-2`/`-3` slug suffixing) → paginated published feed →
  nested comment + reply → like (count increments) → unauthenticated write
  rejected `401` → cross-user edit rejected `403`. All commands and their
  real JSON output are in the project's task history; representative
  examples are quoted in the PR/commit description if applicable.
- Dev servers (in-memory Mongo, API, Vite) were all stopped cleanly after
  verification; the code itself is untouched by that.

### Caveats

- No real standalone MongoDB or Atlas cluster was available in this sandbox,
  so `mongodb-memory-server` (a real embedded `mongod` binary) stood in for
  it during verification. Connecting to a real MongoDB instance requires no
  code changes — only `MONGO_URI` in `.env`.
- Cloudinary credentials are not configured in this environment (by design —
  no secrets are committed). The image upload route
  (`server/src/routes/uploads.js`) returns a clear `503` if
  `CLOUDINARY_CLOUD_NAME` is unset rather than silently failing; it was not
  exercised end-to-end against a real Cloudinary account.
- `web-vitals` logging was wired into `client/src/main.jsx` and observed via
  `console.info` in a running dev session; it was not run through a full
  Lighthouse CI pipeline (not required per the brief).

## Deployment (one real path, consistent with this repo's config)

1. **Client** → any static host that can build a Vite app (Vercel/Netlify).
   Build command `npm run build --prefix client`, output dir `client/dist`.
   Set `VITE_API_URL` to the deployed API's `/api` URL as a build-time env
   var (see `client/.env.example`).
2. **Server** → Render/Railway (or the provided `server/Dockerfile`). Set the
   env vars listed in `server/.env.example`: `MONGO_URI` (MongoDB Atlas
   connection string), `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` (long random
   values, not the dev defaults), `CLIENT_ORIGIN` (the deployed client's
   origin, for CORS), and the `CLOUDINARY_*` vars if image upload is needed.
3. **Database** → MongoDB Atlas free tier; put its connection string in
   `MONGO_URI`.
4. Because the refresh token is an `httpOnly` cookie scoped `sameSite`, the
   client and server should be on same-site domains (or `sameSite: 'none'`
   + HTTPS) in production — see `refreshCookieOptions()` in
   `server/src/utils/tokens.js`, which already switches to `secure: true`
   when `NODE_ENV=production`.

## Repository layout

```
server/            Express API (ESM)
  src/models/       Mongoose schemas (User, Post, Comment)
  src/routes/       auth, posts, comments, tags, uploads
  src/middleware/   auth (JWT + role gate), validation, rate limiting, errors
  src/utils/        slugify, word/reading-time stats, sanitize, tokens
  src/schemas/      zod validation schemas
  scripts/seed.js   manual-only dev seed script
  tests/            Vitest + Supertest + mongodb-memory-server

client/            Vite + React app
  src/pages/        Home, PostDetail, Login, Register, Editor, Dashboard
  src/components/   Layout, MarkdownRenderer, CommentSection/Item, etc.
  src/store/        Zustand auth store (in-memory token)
  src/lib/          api client (axios + refresh-and-retry), markdown utils,
                     hand-written debounce
```
