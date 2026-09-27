# Project Management SaaS — Backend (MVP)

MERN + TypeScript backend: Express, MongoDB (Mongoose), Socket.io, JWT auth,
Zod validation. Includes a Slack-style **Team Chat** (channels + DMs +
real-time messages) as its own feature, separate from task comments.

## What's included (Full backend — MVP + Version 2, per your documentation)

- **Auth**: register, login, logout, `/me`, email verification (real token
  flow), forgot/reset password (**real token flow**, hashed + expiring),
  change password, Google login (**real ID-token verification** via
  `google-auth-library` — configure `GOOGLE_CLIENT_ID` and it works),
  notification preferences.
- **Workspaces**: create, list mine, update, delete, invite members
  (email token), accept invitation, list/update/remove members.
- **Projects**: CRUD, stats (total/completed/in-progress/overdue), archive.
- **Tasks**: CRUD, Kanban status/order updates (broadcast over Socket.io),
  subtasks, filtering (assignee/status/priority/label/search), pagination,
  **task dependencies** (with circular-dependency prevention via graph
  walk), **recurring tasks** (daily/weekly/monthly/custom — auto-generates
  the next occurrence when marked Done).
- **Labels**: own model, full CRUD per workspace (not just free-text tags).
- **Milestones**: full CRUD per project, with computed task progress.
- **Time tracking**: start/stop timer per task, running-timer lookup,
  history by task/user, auto-accumulates `actualMinutes` on the task.
- **File attachments**: real upload via Multer + Cloudinary (task/project/
  comment attachments), file-type and size validation, list/delete.
- **Project templates**: create a template (milestones + tasks), and spin
  up a brand-new real project (with real milestones/tasks) from it.
- **Saved views**: per-user saved filters/sort/view-type, scoped to a
  workspace or project.
- **Global search**: across projects, tasks, members, comments, and labels
  in a workspace.
- **Comments**: on tasks, with @mentions -> notifications.
- **Notifications**: list, mark read/all read, delete.
- **Team Chat (Slack-style)**: workspace channels (`#general` auto-created),
  private channels, 1:1 DMs, real-time messages, typing indicators, message
  edit/delete, emoji reactions. Real-time via Socket.io rooms
  (`channel:<id>`).
- **Analytics**: workspace analytics (**with date-range filters**: today /
  7d / 30d / 3m / custom `from`-`to`), project analytics, team workload,
  **project health** (transparent ON_TRACK / NEEDS_ATTENTION / AT_RISK with
  explained reasons, no black-box score), **activity timeline** per
  workspace/project.
- **Admin**: platform overview, user list/suspend/reactivate, workspace
  list, **workspace detail (members/projects/recent activity)**,
  **workspace suspend/reactivate**, audit logs.
- **Security**: JWT in httpOnly cookie, bcrypt password hashing,
  role-based authorization enforced in middleware (never trust the
  frontend), rate limiting, Zod validation on every mutating route,
  centralized error handler with consistent `{ success, message, code }`
  shape.

Role-based access uses these workspace roles: `OWNER`, `ADMIN`,
`PROJECT_MANAGER`, `MEMBER`, `VIEWER`, plus a platform-level `isSuperAdmin`
flag on the `User` model for the admin dashboard.

## Folder structure

```
src/
  config/        env, db connection
  models/        Mongoose schemas (User, Workspace, WorkspaceMember,
                 Invitation, Project, Task, Comment, Notification,
                 Milestone, Attachment, TimeEntry, ActivityLog,
                 Channel, Message)
  middleware/    auth, workspace role guard, validation, error handler
  validations/   Zod schemas per resource
  controllers/   business logic per resource
  routes/        Express routers, mounted in routes/index.ts
  sockets/       Socket.io server (project rooms, chat rooms, notifications)
  utils/         ApiError, ApiResponse, catchAsync, JWT helpers, mailer
  app.ts         Express app (middleware, routes)
  server.ts      entry point (HTTP + Socket.io bootstrap)
```

## Setup

1. `cd server && npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `MONGODB_URI` — a MongoDB Atlas connection string (free tier is fine)
   - `JWT_SECRET` — any long random string
   - `CLIENT_URL` — your frontend URL (for CORS + cookies), e.g.
     `http://localhost:5173`
   - Google/SMTP/Cloudinary values are optional for local dev — the app
     boots without them (Google login and email sending will just be
     inactive until configured).
3. `npm run dev` — starts on `http://localhost:5000` with `ts-node` +
   `nodemon`.
4. Health check: `GET http://localhost:5000/api/health`

## Notes for the frontend integration

- Auth token is set as an httpOnly cookie (`pm_saas_token`) on
  login/register, and also returned in the JSON body so you can use it as a
  `Bearer` token for Socket.io (`socket.handshake.auth.token`) or from
  non-browser clients.
- Socket.io client should connect with
  `io(SOCKET_URL, { withCredentials: true, auth: { token } })`, then emit
  `project:join`, `channel:join` etc. to receive real-time events (see
  `src/sockets/index.ts` for the full event list: `task:created`,
  `task:updated`, `task:moved`, `task:deleted`, `comment:created`,
  `message:new`, `message:updated`, `message:deleted`,
  `message:reaction`, `channel:typing`, `notification:new`).
- Full API route list is in `src/routes/index.ts` and each `*.routes.ts`
  file — matches the `/api/...` structure from the project spec (auth,
  workspaces, projects, tasks, notifications, chat, analytics, admin).

## What's next (deliberately out of scope — Version 3 / future SaaS)

- Billing/subscription plans, workspace/storage limits, custom branding,
  public API access, Slack/GitHub/Google Calendar integrations — these were
  marked "Version 3 / future SaaS" in your original spec and are not part
  of this backend.

This is the complete MVP + Version 2 backend per your documentation. Once
you've run it and confirmed everything works, I'll build the React +
TypeScript + Tailwind + shadcn/ui frontend (Kanban board, chat UI, all
dashboards, lucide-react icons) as the next zip.
