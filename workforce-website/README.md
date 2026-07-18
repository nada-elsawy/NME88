# NME Workforce

A workforce-management product with two parts, both pure static files (HTML/CSS/JS) —
**no build step, no server, no dependencies.** Colors are sampled from qic.digital (maroon).

1. **Marketing website** (`index.html`) — the public landing page.
2. **Application** (`app.html`) — login / sign-up, demo checkout, and the full in-app
   workspace with customizable settings.

## How to open it

Double-click **`index.html`** (the website) or **`app.html`** (straight to the app).
Works offline in any modern browser. From the website, **Log in** / **Get started**
(and the pricing buttons) open the app.

## Trying the app from the inside

Use a seeded **super-admin** account (details are **not** shown on the login screen —
type them in):

| Email | Password |
|-------|----------|
| **nada.melsawy@yahoo.com** | **123@admin** |
| **admin@nme.app** | **Admin@123** |

You can also just **Create account** to make your own super-admin workspace.

### Forgot password

On the login screen, **Forgot password?** → enter your account email → a 6-digit code
is generated. **Demo note:** there's no backend/email server here, so the code is shown
on-screen (in a real deployment it would be emailed). Enter the code → set a new
password → log in with the new password. Works for any account, including the ones above.

### Language — English / Arabic (RTL)

Use the **language toggle** (in the top bar / nav) to switch between English and Arabic.
Arabic flips the whole UI to right-to-left and uses natural Modern Standard Arabic. Your
choice is remembered. Works on both the marketing site and the app.

### Sign up: role + promo code

**Create account** now asks whether you're a **Manager** or **Employee**, and has an
optional **promo code** field:

- **`demofree123`** → creates a **free** account immediately (skips payment).
- Any other code → a professional error appears under the field ("This promo code isn't
  active…").
- Leave it blank → continue to the demo checkout as before.

**What each role can do**

| | Employee | Manager | Super admin |
|---|---|---|---|
| View own schedule + break schedule | ✅ | ✅ | ✅ |
| Request leave / shift swaps | ✅ | ✅ | ✅ |
| Adjust schedule, shifts & breaks | — | ✅ | ✅ |
| Approve leave / confirm swaps | — | ✅ | ✅ |
| Post announcements | — | ✅ | ✅ |
| Team, Account & Billing | — | ✅ | ✅ |

Everyone gets the **My Profile** page (name, email, country, mobile + dial code, password).

### General settings

Settings now include **Theme** (Light / Dark / **System**), **Business country** (which
also sets the **clock's time zone** — the dashboard clock shows the business country's
local time), plus the existing time format (12h/24h), date format, week start, working
days, currency, and more. Changes apply on **Save**.

### Responsive

The site is fully responsive: it renders the **normal desktop layout** on laptops/PCs and
automatically switches to a **mobile layout** (hamburger menu, stacked cards) on phones —
based on the screen width, no manual switch needed.

Clicking the **NME logo** anywhere (login screen or app sidebar) returns to the
marketing home page.

### Create-account flow

**Create account** → fill your details → **demo checkout** (choose a plan + billing
cycle). ⚠️ The checkout is a **demo** — it does **not** process real payments; don't
enter real card details (any values are accepted). Completing it creates a super-admin
account for your own workspace and logs you in.

## In-app features

Dashboard · Schedule (weekly) · Attendance (clock in/out) · Leave (request + approve) ·
Announcements (post) · Team roster · **My Profile** · **Settings** · Account & Billing.

### My Profile

Each account has a **My Profile** tab (also reachable by clicking your name in the top
bar) to edit **name, email, country, and mobile number** — the mobile **dial code is
set automatically from the country** — plus a **change-password** section. Changes only
take effect when you click **Save changes** (or discard with **Cancel**).

### Settings — Save / Cancel

Settings changes are staged and only applied when you click **Save changes** at the
bottom; **Cancel** discards them.

## Customization (Settings)

Everything below applies **instantly** across the app and is saved in your browser:

| Setting | Options |
|---------|---------|
| **Start day of week** | Saturday / Sunday / Monday — reorders the whole schedule week |
| **Time format** | 24-hour (`17:00`) / 12-hour (`5:00 PM`) — applies to every time shown |
| **Date format** | `18 Jul 2026` / `Jul 18, 2026` / `2026-07-18` |
| **Working days** | Toggle which days get a scheduled shift |
| **Currency** | QAR / USD / EUR / GBP / AED |
| **Default shift start / end** | Times used when generating the schedule |
| **Overtime after** | 6 / 8 / 9 / 10 hours |
| **Max concurrent breaks** | 1–5 |
| **Workspace name** | Shown in the sidebar |

Use **Reset all demo data & settings** in Settings to restore the original state.

## Files

```
workforce-website/
├── index.html        # marketing landing page
├── app.html          # application shell (auth + app)
├── css/
│   ├── styles.css    # marketing site styles (maroon)
│   └── app.css       # application styles (maroon)
└── js/
    ├── main.js       # marketing progressive enhancements
    └── app.js        # the whole app: auth, payment, views, settings
```

## Notes

- The app is a demo: data (accounts, schedules, leave, settings) lives in the browser's
  `localStorage`. Clearing site data resets it. Nothing is sent anywhere.
- Staff/schedule data is seeded from `workforce_db_export.sql` plus a few sample team
  members; the demo payment step stores/charges nothing.
```
