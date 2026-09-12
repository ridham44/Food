# OrbitFood — Demo Login Credentials

Local dev/demo accounts only, created by the backend seed scripts
(`orbitfood-backend/scripts/seed-demo-users.js` and
`seed-demo-tenants-and-history.js`). Not real users — safe to use for
testing, but don't reuse these passwords anywhere real.

Sign in at `/login`, choose **Business** (email/password) or **Customer**
(mobile/OTP) — see below for which each account uses.

## Admin (platform admin — `/login/business`)

| Email | Password | Mobile |
|---|---|---|
| john@example.com | admin@123 | 9876543210 |

Lands on `/admin` after login.

## Business / Tenant owners (`/login/business`)

| Restaurant | Email | Password | Mobile |
|---|---|---|---|
| OrbitFood (default demo tenant) | manager@orbitfood.test | manager@123 | 9998887777 |
| Sunset Grill & Bar | owner@sunsetgrillbar.test | tenant@123 | 3105550101 |
| Oilve Garden | owner@oilvegarden.test | tenant@123 | 2125550102 |
| Verana Diner | owner@veranadiner.test | tenant@123 | 5125550103 |

Each of the 3 seeded restaurants above also has a waiter/staff login:
`waiter@<restaurant-slug>.test` / `waiter@123` (mobile is randomly generated
per seed run — check the DB `user` table, filter `email LIKE 'waiter@%'`, if
you need the exact number).

## Customer (`/app/login` — mobile + OTP, no password)

Customers sign in with just their mobile number; the OTP is generated
server-side per attempt (returned directly in the `send-otp` API response /
shown on-screen in this dev build — there's no fixed OTP to remember).

| Name | Mobile | Email |
|---|---|---|
| Demo Customer | 9998877766 | customer@orbitfood.test |
| Emma Wilson | 2125550201 | emma.wilson@example.test |
| Olivia Moore | 3105550202 | olivia.moore@example.test |
| Ava Thomas | 5125550203 | ava.thomas@example.test |
| Isabella Jackson | 3125550204 | isabella.jackson@example.test |
| Mia White | 4155550205 | mia.white@example.test |
| Chloe Harris | 2125550206 | chloe.harris@example.test |
| Grace Clark | 3105550207 | grace.clark@example.test |
| Hannah Lewis | 5125550208 | hannah.lewis@example.test |
| James Walker | 3125550209 | james.walker@example.test |
| Michael Young | 4155550210 | michael.young@example.test |

## Re-seeding

If a fresh database is missing any of the above, run from `orbitfood-backend/`:

```
node scripts/seed-demo-users.js
node scripts/seed-demo-tenants-and-history.js
```

Both are idempotent — safe to re-run, they skip anything that already exists.
