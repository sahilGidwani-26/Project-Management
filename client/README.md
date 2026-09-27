# Flowbase — Frontend (React + TypeScript + Vite)

Connects to the `server/` backend in this same zip. Kanban board with
real drag-and-drop, Slack-style team chat, dashboards, and dark/light/system
theme — all wired to real APIs (React Query) and real-time events
(Socket.io), not mock data.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS with CSS-variable design tokens (dark/light/system theme)
- shadcn/ui-pattern components (Radix primitives + `class-variance-authority`,
  under `src/components/ui/` — same structure the shadcn CLI generates, so
  `npx shadcn add <component>` works if you want more of them)
- lucide-react icons throughout
- @tanstack/react-query for all server state (no manual loading/error
  booleans scattered around)
- @hello-pangea/dnd for the Kanban drag-and-drop
- socket.io-client for real-time task moves, comments, and chat messages
- recharts for the dashboard/analytics charts
- sonner for toasts

## Setup

1. `cd client && npm install`
2. Copy `.env.example` to `.env`:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```
   (Point these at your deployed backend URL in production.)
3. Make sure the backend (`../server`) is running first.
4. `npm run dev` — opens on `http://localhost:5173`.

## What's implemented

- **Auth**: login, register, forgot password — real calls to the backend,
  JWT stored and sent as a Bearer token (also works via the httpOnly
  cookie the backend sets).
- **Onboarding**: create your first workspace.
- **Dashboard**: live stats (projects, team, overdue tasks) + tasks-by-status
  chart + recent activity feed.
- **Projects**: create/list projects with progress bars.
- **Kanban board**: 5 columns (Backlog/Todo/In Progress/In Review/Done),
  real drag-and-drop that persists to the backend and broadcasts to every
  other viewer on that project in real time via Socket.io.
- **List view**: sortable table view of the same tasks.
- **Task detail**: status/priority editing, comments with real-time-ready
  structure, delete.
- **Project health**: shown right on the project header — ON_TRACK /
  NEEDS_ATTENTION / AT_RISK with the actual reasons, pulled from the
  backend's transparent health check.
- **My Tasks**: everything assigned to you, across every project.
- **Team Chat (Slack-style)**: channels, DMs, real-time messages, typing
  indicators — this is a distinct "Team Chat" section, separate from task
  comments/documentation, exactly as you asked for.
- **Analytics**: tasks-by-status pie chart with date-range filter, team
  workload bars.
- **Notifications**: dropdown panel from the top bar, mark all as read.
- **Settings**: profile editing, notification preferences, theme.
- **Admin dashboard** (visible only if your user has `isSuperAdmin: true`
  in MongoDB): platform overview, user suspend/reactivate, workspace
  suspend/reactivate, audit log viewer.
- **Global search**: press Enter in the top search bar.
- **Dark / Light / System theme**: toggle in the top bar, persisted in
  `localStorage`, respects OS preference when set to "System".

## What's simplified / not wired up in this pass

- Calendar and Timeline/Gantt project views (Board + List are fully live;
  these two tabs from the original spec are not built yet).
- File/attachment upload UI (the backend endpoint exists and works; there's
  no upload button in the task detail dialog yet).
- Time tracking, milestones, labels, saved views, and project templates
  have complete backend APIs but no dedicated UI screens yet — next
  candidates to build.
- Landing page is a single lean page, not the full 12-section marketing
  page from the original spec.

To make your own user a super admin for testing the admin dashboard, set
`isSuperAdmin: true` on your user document directly in MongoDB (there's no
UI for granting this, intentionally — it's a manual/ops action).
