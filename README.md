# Workforce Portal

A self-contained workforce scheduling & attendance web app — built from the
structure and data in `workforce_db_export.sql`. No build step, no server,
no dependencies: it runs entirely in the browser.

## How to open it

Double-click **`index.html`**, or right-click → *Open with* → your browser
(Chrome / Edge / Firefox). That's it.

## Signing in

This is a **demo build**, so passwords are not verified (the SQL export only
contained bcrypt password hashes, not plaintext passwords). Sign in either by:

- Clicking one of the **demo user** buttons on the login screen, or
- Typing an **Employee ID** (any password) — e.g. `EMP006`, `abdo123`, `SA003`.

| Employee ID | Name                | Role         | Sees |
|-------------|---------------------|--------------|------|
| `SA003`     | Nada El Sawy        | super_admin  | Everything incl. Administration |
| `abdo123`   | Abdelrahman Abdullah| manager      | + Team, Approvals |
| `MGR001`    | Test Manager        | manager      | + Team, Approvals |
| `EMP006`    | Nada Elsawy         | employee     | Dashboard, Schedule, Attendance, Leave, Announcements |

## Features

- **Dashboard** — today's shift, clock status, weekly stats, latest announcements;
  managers also see a team snapshot.
- **My Schedule** — the current work week with shift times and break windows.
- **Attendance** — clock in / clock out (persisted) and full history.
- **Leave** — request leave; managers approve/reject from **Approvals**.
- **Announcements** — company notices; super-admins can post new ones.
- **Team** (manager+) — roster with today's attendance status.
- **Administration** (super-admin) — users, departments & teams, break settings.

## Data & persistence

- Seed data comes from `workforce_db_export.sql`, plus a few sample Travel Team
  members so schedules/team views are populated. (The export's schedule/attendance
  rows referenced users that had been deleted, so those were re-mapped.)
- Your actions (clock-ins, leave requests, approvals, new announcements) are saved
  in the browser's `localStorage`. Use **"Reset demo data"** in the sidebar to
  restore the original seed.

## Files

```
workforce-portal/
├── index.html        # markup + app shell
├── css/styles.css    # all styling (light theme)
└── js/
    ├── data.js       # seed data derived from the SQL export
    └── app.js        # SPA logic: auth, routing, views, persistence
```

## Notes / next steps

- This machine has no Node.js or Python installed, so the app was built as a
  static site (opens directly, no dev server needed).
- To turn this into a real multi-user app with genuine login and a live database,
  you'd add a backend (e.g. Node/Express + the PostgreSQL database this data came
  from) — the current `data.js` mirrors that schema, so the mapping is direct.
```
