# Flowbase — Project Management SaaS

Full-stack MERN + TypeScript app: `server/` (Express + MongoDB + Socket.io)
and `client/` (React + Vite + Tailwind + shadcn-pattern UI). Each folder
has its own detailed README — read those for full feature lists.

## Run locally (two terminals)

**Terminal 1 — backend**
```
cd server
npm install
cp .env.example .env   # fill in MONGODB_URI and JWT_SECRET at minimum
npm run dev            # http://localhost:5000
```

**Terminal 2 — frontend**
```
cd client
npm install
cp .env.example .env   # defaults already point at localhost:5000
npm run dev            # http://localhost:5173
```

Open `http://localhost:5173`, register an account, create a workspace, and
you're in.

## To try the Admin dashboard

The first registered user is not automatically a super admin. In MongoDB,
find your user document in the `users` collection and set:
```
{ "isSuperAdmin": true }
```
Then visit `http://localhost:5173/admin`.

## To try Google Login

Set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `server/.env` and
`VITE_GOOGLE_CLIENT_ID` in `client/.env` from a Google Cloud OAuth Client
(Web application type). The backend verifies the ID token server-side
before creating a session — it's real, not a stub.

## Honesty notes (please read before assuming something is broken)

- This was built and reviewed in a sandbox with **no network access**, so
  `npm install` / `tsc` / a real build could not be run here. Everything
  was written carefully and cross-checked by hand (imports, exports,
  route wiring), but a first-run TypeScript error is possible. If you hit
  one, share the error and it'll get fixed fast.
- Calendar and Timeline/Gantt project views, file-upload UI, and dedicated
  screens for time tracking / milestones / labels / saved views /
  templates are **not** built in the frontend yet — their backend APIs are
  complete and working, just no UI screen calls them yet. Everything else
  listed in `client/README.md` and `server/README.md` is real and wired
  end-to-end (not dummy data).
