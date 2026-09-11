# OrbitFood — Security Audit & Remediation

Full audit of the OrbitFood multi-tenant food-ordering backend (`orbitfood-backend/`) and its
frontend (`orbitfood-frontend/`), covering authentication, authorization, multi-tenant isolation,
payments, and the OWASP-style checklist requested. Every item below was verified by reading the
actual route → middleware → controller → Sequelize model chain (not just the frontend), and the
fixes were tested against a live copy of the dev database (real login, real OTP flow, real
cross-tenant attack attempts) before being written up here.

**Architecture note (read this first):** the backend has an automatic tenant-scoping mechanism —
`Model.hasTenantCondition(hasTenant, canBeNull)` (`app/db/audit-logger/index.js`) — that hooks
`beforeFind`/`beforeCount`/`beforeCreate` to inject `where.tenantId = <tenantId from the
authenticated user's JWT, via CLS>`. This is a real, working defense, but it has three sharp edges
that account for the majority of the vulnerabilities found:

1. It does **not** hook `beforeUpdate`/`beforeDestroy`/`beforeBulkUpdate`/`beforeBulkDestroy` — a
   bare `Model.update(data, { where })` or `Model.destroy({ where })` is never auto-scoped.
   (Safe as long as the row was already fetched through a tenant-scoped read first.)
2. Passing `disableTenantCheck: true` on the **top-level** query options fully bypasses the hook —
   several controllers used this legitimately (dual customer/tenant routes, where a customer has no
   `tenantId` and the hook would otherwise crash on `undefined`), but a few used it as a blanket
   bypass without re-adding a manual check, which is what created most of the IDOR bugs below.
3. `disableTenantCheck: true` on an **individual `include`** is a silent no-op — the hook only reads
   that flag off the top-level options object. This was actually the source of one bug introduced
   and then caught during this session's own testing (see menu_rating below) — a useful signal for
   how easy this footgun is to hit.

Any model defined with `hasTenantCondition(false)` (Role, Permission, Customer, MenuRating,
OrderList, OrderBill, OrderItem, DiscountCoupon, DiscountCouponUser, ComboGroup, TaxConfig, Tenant,
GeoCountry/State/City, MenuAdmin, ActivityLog) has **zero** automatic scoping and depends entirely
on the controller doing it manually.

---

## Critical fixes

### 1. OTP returned in the API response, no expiry, no attempt limit, no resend cooldown
**File:** `orbitfood-backend/app/routes_controller/auth/lib/controller.js` (`sendOtp`, `customerlogin`)

`sendOtp` echoed the generated OTP straight back in the JSON response ("Returning OTP for demo
purposes"), unconditionally, in every environment. `customerlogin` accepted the OTP with no
expiry, no attempt cap, and no resend throttling beyond the generic per-IP rate limiter.

**Fix:**
- OTP is now only included in the response when `NODE_ENV !== 'production'` (keeps the current
  no-SMS-gateway demo flow working locally; a production deployment never sees it).
- Added `otpExpiresAt`, `otpAttempts`, `otpLastSentAt` columns (migration
  `202500056-add-otp-security-columns-customer.js`).
- OTP now expires 5 minutes after being sent, locks out after 5 wrong guesses (forcing a resend),
  is invalidated the moment it's used successfully (already existed) and now also on expiry/lockout,
  and enforces a 60s resend cooldown per account (`429` with a "wait Ns" message).
- The `otp` column itself is now excluded from the `Customer` model's default query scope (it was
  previously fully exposed — `defaultScope: { attributes: { exclude: [] } }` — meaning any endpoint
  returning a `Customer`/`req.user` instance, e.g. `GET /customer/me`, leaked the live OTP value).

**Verified live:** sent an OTP, confirmed `otp` field present only in dev mode; immediate resend
returned `429`; wrong OTP returned `401 Invalid OTP`; successful login cleared the OTP; `GET
/customer/me` no longer contains an `otp` field.

### 2. Any tenant staff member could view/edit/delete/create ANY user across ANY tenant, and grant themselves platform-admin
**File:** `orbitfood-backend/app/routes_controller/user/lib/controller.js` + `index.js`

`findById`, `update`, `delete`, `updateStatus`, and `userFiltration` all fetched the target `User`
by `id` alone with `disableTenantCheck: true` and no tenant comparison — any authenticated tenant
staff member (down to the lowest-privileged role, since **no route had any role/permission
middleware at all**) could read, edit, deactivate, or delete a user belonging to a completely
different tenant, including that tenant's owner account. Worse: `create`/`update` accepted
`roleId` with `disableTenantCheck: true` and no `type` check, so a tenant user could assign
themselves or anyone else a `type: '1'` (platform admin) role — full privilege escalation from any
tenant account.

**Fix:** every handler now scopes the target row to `tenantId: req.user.tenantId` unless the
caller is an actual platform admin (`Role.type === '1'`); role assignment is restricted to roles
belonging to the same tenant and explicitly forbidden from being `type: '1'` for non-admin callers;
`create` now derives `tenantId` from the caller (not the request body) unless the caller is a
platform admin.

**Verified live:** confirmed the manager account can only list/see its own tenant's users.

### 3. Unauthenticated password reset — anyone could lock any tenant admin out of their account
**File:** `orbitfood-backend/app/routes_controller/user/lib/controller.js` (`forgotPassword`)

`PUT /forgot-password` took only an email, no verification step (no reset token, no OTP, no
confirmation link), reset the password to a random string, and never sent that password anywhere —
not even by email. Anyone who knew or guessed a tenant admin's email could permanently lock them
out on demand, with zero benefit to the real owner. It isn't called from the frontend at all.

**Fix:** disabled (`501 Not Implemented`, generic message) until a real token-based reset-link flow
is built. Left detailed comments in the code for what that flow needs to look like.

### 4. Role privilege escalation — any tenant user could mint or edit a role with platform-admin `type`
**File:** `orbitfood-backend/app/routes_controller/role/lib/controller.js`

`create`/`update` wrote `body.type`/`body.isAdmin` verbatim with no check that the caller was
actually a platform admin. `adminMiddleware.js` gates purely on `Role.type === '1'`, so a tenant
user creating a role with `type: '1'` and then assigning it to a user (bug #2 above) was a complete,
two-step path to full admin.

**Fix:** `type`/`isAdmin` are now forced to `'2'`/`false` for any caller who isn't a platform admin,
on both create and update.

**Verified live:** POSTed `{"type":"1","isAdmin":true}` as a tenant manager — the created role came
back as `"type":"2","isAdmin":false"`.

### 5. Permission module had zero ownership scoping — read/write any tenant's entire permission matrix
**File:** `orbitfood-backend/app/routes_controller/permission/lib/controller.js`

`Permission` has no `tenantId` column of its own (ownership is via `roleId → Role.tenantId`) and
`Permission.hasTenantCondition(false)` means no auto-scoping either way. Every handler
(`create`/`update`/`delete`/`findById`/`findAll`/`filtration`) operated on a bare `id`/`roleId`
with no join back to `Role.tenantId` — any authenticated user could read or rewrite any other
tenant's role-permission matrix.

**Fix:** every handler now joins through `Role` and checks `Role.tenantId === req.user.tenantId`
(or allows it through for a platform admin).

### 6. Global platform tables (nav menu, countries/states/cities) writable by any tenant staff
**Files:** `menu_admin/index.js`, `geo_country/index.js`, `geo_state/index.js`, `geo_city/index.js`

`MenuAdmin` (drives the permission-menu structure every tenant's RBAC depends on) and the
geo-reference tables had `create`/`update`/`delete`/`updateStatus` behind plain `auth` with no
`adminOnly`, unlike the structurally identical `setting` module which was already correctly gated.
Any tenant staff member could tamper with platform-wide navigation/permission structure or delete
shared address reference data used by every tenant.

**Fix:** added `adminOnly` to every mutating route in all four modules.

### 7. Cross-tenant order/invoice disclosure
**Files:** `report/lib/controller.js` (`getFullOrderDetails`), `bill_pdf/lib/generator.js`

- `POST /report/orders` fetched an `OrderList` by `orderListId` alone (`OrderList.hasTenantCondition(false)`)
  — any authenticated tenant or customer token could pull any other party's full order/bill detail.
- `POST /bill-pdf` had the identical gap for invoice generation (customer PII, GST number, full
  bill breakdown), **and** the generated PDF was saved under `uploads/pdf/`, which `server.js`
  serves as public static content — once any staff member generated an invoice once, it was
  permanently downloadable by anyone who ever saw that `orderId` (routinely returned in plain JSON
  to the owning customer), with zero authentication.

**Fix:**
- `getFullOrderDetails` now scopes by `tenantId` (staff) or `customerId` (customer) depending on
  which token is presented.
- Invoice PDFs are now written to `private_uploads/pdf/` (outside the statically-served `uploads/`
  tree, added to `.gitignore`) and can only be retrieved via a new authenticated
  `GET /bill-pdf/:orderId/download` route that re-checks ownership (staff of the owning tenant, the
  customer who placed the order, or a platform admin) before streaming the file. `orderId` is also
  validated against a strict UUID regex before ever touching a filesystem path (defense in depth).

### 8. Customer A could read Customer B's entire review history
**File:** `orbitfood-backend/app/routes_controller/menu_rating/lib/controller.js` (`getCustomerReviewHistory`)

`GET /menu-rating/:customerId` trusted the URL param with no comparison to the caller's own id —
textbook IDOR, explicitly called out in the audit scope ("Customer A cannot access ... reviews").

**Fix:** route changed to `GET /menu-rating/my-reviews`, customer-only, always scoped to
`req.user.id`. (The old route was unused by the frontend, so nothing to migrate there.) Also fixed
a second bug this exposed during testing: the `Menu` include on that query crashed for a customer
caller because `disableTenantCheck` on an *include* is a no-op in this codebase's hook (see
architecture note above) — the fix moves the flag to the top-level query, which is what the hook
actually reads.

### 9. Tenant-only report endpoints reachable by customer tokens
**Files:** `order_payment/index.js`, `menu_rating/lib/controller.js` (`menuRatingReport`, `comboMenuReport`)

Several tenant-dashboard-only endpoints (unpaid-bills-by-phone lookup, payment mode/total reports,
payments list, menu rating reports) were wired to the dual customer-or-tenant middleware even
though they only make sense for staff (they all key off `req.user.tenantId`). They happened to
fail closed today only because Sequelize throws on a `where: { tenantId: undefined }` rather than
silently dropping the filter — an incidental crash, not a real authorization check.

**Fix:** the phone-lookup/report/list endpoints in `order_payment` now require `staffAuth`
(tenant-only) instead of the dual middleware. `menuRatingReport`/`comboMenuReport` now explicitly
403 a caller with no `tenantId` instead of silently blending every tenant's data together, and
`comboMenuReport` gained an actual tenant filter (it previously had none at all).

### 10. AI assistant endpoints: one unauthenticated, one leaking every tenant's data to any tenant user
**Files:** `groq_chat/index.js`, `groq_chat/lib/controller.js`

- `POST /chat` (generic LLM proxy) had **no auth middleware at all** — anyone could use the server
  as a free relay to the paid Groq API.
- `POST /ask-admin-ai` required only `auth` (any tenant user), not `adminOnly`, while its handler
  (`askAdminAI`) explicitly queries platform-wide data with `disableTenantCheck: true` across
  tenants, roles, permissions, activity logs, logins, and customers, and hands the result to the
  LLM to answer with — a full cross-tenant data exfiltration path from any authenticated staff
  account.
- `askTenantAI`'s own dataset builder queried `Customer`/`CustomerPoints`/`DiscountCouponUser` with
  no tenant filter at all, leaking other tenants' customer PII and coupon-redemption data into a
  tenant's own AI assistant answers.

**Fix:** `/chat` now requires a valid customer-or-tenant token; `/ask-admin-ai` now requires
`adminOnly`; the `Customer`/`CustomerPoints` queries in `askTenantAI` are now scoped to customers
who have actually ordered from that tenant (derived via `OrderList`, same pattern as
`customerList`/`customerProfile`), and `DiscountCouponUser` is now joined through `DiscountCoupon`
with a `tenantId` filter.

### 11. Cross-tenant menu mixing in order creation
**File:** `orbitfood-backend/app/routes_controller/order_placement/lib/controller.js`

`orderCustomer`, `tenantPlaceOrder`, and `addOrderItem` looked up `Menu`/`ComboGroup` rows by id
only (`disableTenantCheck: true`, no `tenantId` filter) — a customer (or a compromised tenant
session) could place an order "with" Tenant A while including menu items that actually belong to
Tenant B. `utils/lib/orderPricing.js` (used by the Razorpay checkout path) already had this exact
fix with a code comment explaining it — it just hadn't been applied to the older dine-in/counter
order-creation paths.

**Fix:** added `tenantId` to all three `Menu`/`ComboGroup` lookups, matching the already-fixed
Razorpay path.

**Verified live:** placing an order for Tenant A using a real Tenant B menu item now returns `400
Invalid menuId or comboId in items`; a normal same-tenant order still succeeds with correct pricing.

### 12. Customer update/delete had no tenant-relationship check
**File:** `orbitfood-backend/app/routes_controller/auth/lib/controller.js` (`update`, `delete` for `Customer`)

`PUT /customer-update/:id` and `DELETE /customer-delete/:id` (both gated only by generic `auth`,
i.e. any tenant staff member) operated on any customer row platform-wide, with no check that the
customer had ever interacted with the caller's tenant — any tenant's staff could edit or delete any
customer on the entire platform.

**Fix:** added `assertCustomerManageable`, which requires the customer to have placed an order with
the caller's tenant (same derivation `customerProfile` already used), or the caller to be a
platform admin.

### 13. Mass assignment
**Files:** `vendor/lib/controller.js` (`updateVendor`), `expense_entry/lib/controller.js` (`update`)

Both spread the raw request body straight into `.set()`/`.update()` with no allowlist —
`tenantId`/`createdBy` could be overwritten by the client, moving a vendor or expense record to a
different tenant or spoofing the audit trail.

**Fix:** replaced with explicit field allowlists. Also fixed a validation bug on the way past this
(`expense_entry`'s validator checked `payment_mode`, the model field is `paymentMode`, so the check
never actually fired against real input).

**Verified live:** updating a vendor with `{"tenantId": "<other-tenant>"}` in the body now silently
keeps the original `tenantId`.

### 14. Raw SQL string interpolation for points/discount decrement
**Files:** `Customer_points/lib/controller.js`, `discount_coupon/lib/controller.js`

`totalPoints: db.Sequelize.literal(\`totalPoints - ${discountAmount}\`)` built a raw SQL fragment
by string interpolation. Not currently exploitable (the value passes an `isNaN`/`parseFloat` gate
first), but it's the wrong pattern and one gate away from an injection if that validation is ever
relaxed.

**Fix:** replaced both with Sequelize's built-in `Model.decrement('totalPoints', { by, where })`,
which binds the value as a real query parameter.

---

## Payment security — reviewed, already solid

`checkout_payment/lib/controller.js` (Razorpay flow) was already correctly built: price/tax/discount
always computed server-side from live `Menu`/`ComboGroup`/`TaxConfig`/`DiscountCoupon` rows (never
trusted from the client), Razorpay signature verified with `crypto.timingSafeEqual` on both the
synchronous verify endpoint and the webhook, the webhook is gated by HMAC over the raw request body
rather than a customer token (correct trust boundary for a server-to-server callback), and order
completion is idempotent via a row lock so a race between the verify call and the webhook can't
double-process a payment. `RAZORPAY_KEY_SECRET`/`RAZORPAY_WEBHOOKS_SECRET` are read from `process.env`
only, never hardcoded or returned to the client (`GET /payment/config` deliberately returns only the
public `keyId`). No card/CVV data is ever collected or stored — payment happens entirely via
Razorpay's own hosted flow.

One real gap found and fixed here: `order_payment`'s manual "record a payment" endpoint
(`makePaymentByBillId`) was already correctly ownership-checked, but the *tenant-report* endpoints
sitting next to it in the same file were reachable by customer tokens (see item 9 above) — fixed.

---

## Information leakage — `throwException` fixed centrally

**File:** `orbitfood-backend/utils/lib/common-function.js`

The shared error-handling helper used by the large majority of controllers
(`return common.throwException(error, 'X API', req, res)`) unconditionally included `error.message`
in the HTTP response in every environment, including production — leaking raw Sequelize/MySQL error
text (column names, constraint names, query fragments) to the client on any unhandled failure.

**Fix:** `error` is now only included in the response body when `NODE_ENV !== 'production'`; the
full detail still goes to the server console/log either way, so debugging isn't affected. This is a
single-point fix that covers every controller routing through this helper. (A number of older
controllers build their error response manually rather than through this helper and weren't touched
— see Known limitations below.)

---

## File upload security

**Files:** new `utils/lib/imageUpload.js`, used by `menu`, `tenant`, `user`, `geo_country`, and
`auth` (customer profile image) route files (all previously had their own copy-pasted, unhardened
multer config).

Previously: the stored filename came from the client-supplied `file.originalname` (only whitespace
stripped — and even that was broken by a regex typo, `/\\s+/g` instead of `/\s+/g`, in the user-
profile upload specifically), with no check for `../` path-traversal sequences, and the extension was
fully attacker-controlled. `fileFilter` only checked `file.mimetype` — the client-supplied multipart
`Content-Type`, trivially spoofable — with no check of the file's actual extension. Combined with
`server.js` serving `/uploads` as plain static content with CSP disabled, this meant an attacker
could upload e.g. a `.html`/`.svg` with `Content-Type: image/png` and have it served back as
browser-executable content from the app's own origin — a stored-XSS vector.

**Fix (`utils/lib/imageUpload.js`):**
- Storage filename is now always server-generated (`Date.now()_<32 hex chars>`) — the client's
  filename is never used for anything except reading its extension.
- `fileFilter` now requires **both** the (still-spoofable) mimetype **and** the file's own extension
  to be in an image allowlist (`png`/`jpg`/`jpeg`/`webp`).
- 10MB size cap kept as-is.

**Verified live:** an upload with `Content-Type: image/png` but filename `evil.html` (containing
`<script>`) was rejected with `400`; a real PNG uploaded with a `../../../../pwned.png` filename was
accepted and stored under a fully random, sanitized name — no traversal, no attacker-chosen name.

---

## Authentication & session management

- **JWT validation**: both auth middlewares (`middleware.js` for staff, `CustomerMiddlewear.js` for
  customer-or-staff) verify signature and algorithm (`HS256`) via `jsonwebtoken`, re-fetch the user
  from the DB on every request (so a deactivated account is rejected even with a still-valid token),
  and reject on any verification failure. Unchanged — already correct.
- **Token expiration**: 1-day expiry on customer/tenant login tokens — unchanged (reasonable for
  this app; shortenable if desired, noted below).
- **Server-side logout/session invalidation (new)**: previously, "logout" only cleared client-side
  state (`zustand` store) — the JWT itself stayed fully valid server-side for its whole 1-day
  lifetime regardless. Added a `tokenValidAfter` watermark column to `User` and `Customer`
  (migration `202500057-add-token-valid-after.js`), checked in both auth middlewares against the
  token's own `iat`; added `POST /logout` and `POST /customer/logout` that stamp it; wired the
  frontend `authStore`/`customerAuthStore` `logout()` actions to call the new endpoint (best-effort,
  never blocks the client-side clear). Also stamped on password change (both `/change-password` and
  `/profile/change-password`) so changing your password invalidates any other active session —
  the endpoint issues a fresh token in the same response so the session that just authenticated with
  the old password isn't itself logged out.
  **Verified live:** logged out, then replayed the old token — `401 Session expired. Please log in
  again.`
- **Password hashing**: `bcryptjs`, cost factor 10, via a Sequelize setter on the `User` model — real
  hashing, not reversible. Unchanged, already correct.
- **`passwordShow` (plaintext password mirror)**: the `User` model has a `passwordShow` column that
  stores the password in plaintext alongside the hash — written on every create/update/password-
  change, apparently for an admin "view password" convenience feature. **No such feature exists in
  the current frontend** (grepped — zero references), and it directly undermines the point of
  hashing. Could not safely remove the column outright without a migration + confirming no external
  consumer depends on it, so the immediate fix was to exclude it from the `User` model's
  **default query scope** (previously only `password` was excluded there — `passwordShow` was
  returned by default on any un-scoped `User` query that forgot to explicitly exclude it, and a couple
  of endpoints already did that ad hoc, which only worked because they remembered to). This closes
  the leak platform-wide in one place. **Recommendation:** drop the column and the feature entirely
  in a follow-up migration once confirmed nothing else needs it.
- **Secure cookies**: not applicable — the app never uses cookies for auth; JWTs are Bearer tokens
  only (confirmed: zero `res.cookie(` calls anywhere in the backend). No `httpOnly`/`secure`/
  `sameSite` gap to close because no cookie exists.
- **Client-side token storage**: both `authStore`/`customerAuthStore` persist the access token via
  `zustand`'s `persist` middleware, which defaults to `localStorage` — readable by any JS running
  same-origin (i.e., an XSS elsewhere would be able to read it). No `dangerouslySetInnerHTML` or
  similar raw-HTML rendering sink was found anywhere in the frontend, so there's currently no known
  XSS vector to exploit this through, but it's worth calling out as residual risk: `httpOnly` cookies
  would remove this exposure entirely at the cost of adding CSRF protection back in. Not changed in
  this pass (would be a larger architectural change); noted for the team's own risk call.

---

## Mass assignment — swept, two real findings (fixed, see #13 above)

Searched every `.create(`/`.update(`/`.set(`/`Model.build(` call across all controllers for a raw
`...req.body` spread. Only `vendor` and `expense_entry` did this; every other controller (user,
tenant, role, permission, setting, menu, order_placement, order_payment, checkout_payment) already
built its create/update payload from explicitly named fields.

---

## Input security

- **SQL injection**: the only application-level raw `sequelize.query()` call in the codebase
  (`auth/lib/controller.js`'s `customerList`) uses bound `replacements`, not string concatenation —
  safe. No other unsafe raw-SQL interpolation of request data found anywhere.
- **NoSQL injection**: not applicable — this is a MySQL/Sequelize backend, no NoSQL query surface.
- **XSS / unsafe HTML**: no sanitization library is used on stored text (reviews, addresses, etc.),
  but no `dangerouslySetInnerHTML`/`innerHTML`/raw-HTML rendering sink exists anywhere in the React
  frontend either (React escapes all text content by default), so there is currently no exploitable
  stored-XSS path through the API responses being re-rendered. Review text is capped at 500 chars
  and trimmed server-side. **Recommendation:** if a raw-HTML renderer is ever introduced (rich-text
  reviews, admin notes, etc.), sanitize on write, not just rely on the current absence of a sink.
- **Path traversal**: fixed in file uploads (see above) and hardened in `bill_pdf` (UUID-format
  validation on `orderId` before it's used in a filesystem path, on top of the ownership check and
  the DB column's own UUID type constraint).

---

## API security — authentication, authorization, ownership, rate limiting

- Every route file was checked for missing `auth`/`adminOnly`/ownership middleware; gaps found and
  fixed are listed in items 2, 4, 5, 6, 9, 10, 12 above.
- **Rate limiting**: already in place platform-wide (`generalLimiter`, 600 req/15min/IP on all `/api/v1`
  routes) plus a stricter `authLimiter` (20 req/15min/IP) on every login/OTP/password endpoint, and a
  separate `aiLimiter` on the AI endpoints. Unchanged — already a solid baseline. Per-account OTP
  throttling (expiry/attempts/cooldown, item #1) is new and layers on top of this.
- **Safe error responses**: fixed centrally via `throwException` (see Information leakage above).
- Frontend button/route hiding was **not** treated as a security control anywhere in this pass —
  every fix above is enforced in the Express route/controller/model layer; the frontend changes made
  (auth store logout call, change-password token refresh, review-history route rename) are purely to
  keep the UI working correctly against the now-hardened backend, not to provide any security
  boundary themselves.

---

## CORS / headers

**File:** `orbitfood-backend/server.js`

- CORS was already allowlist-based (not `*`), but additionally trusted **any** origin ending in
  `.onrender.com` — an entire public PaaS domain, not just this project's own deployment, so any
  other tenant's app hosted there would also pass CORS. The actual configured production frontend
  origin (`CORS_ALLOW_TENNAT_URL` env var) is `https://master.my-company.app/`, not an onrender.com
  URL, so this wildcard wasn't even needed for the real deployment.
  **Fix:** removed the wildcard suffix trust; only the explicit, comma-separated
  `CORS_ALLOW_TENNAT_URL` list (plus `localhost:5173`/`4173` for local dev) is trusted now. Add a
  specific preview URL to that env var if one is genuinely needed.
- `credentials: true` is correctly **not** set (auth is Bearer-token only, no cookies involved).
- Security headers: `helmet()` already applied with sane defaults (`X-Content-Type-Options: nosniff`
  etc. on by default); CSP is deliberately left off because this is a JSON API, not server-rendered
  HTML, and a default CSP would break the Swagger UI — a reasonable, already-documented trade-off,
  and no longer a meaningful gap now that file uploads can't produce executable content in the first
  place (see File upload security above).
- CSRF: not applicable in the classic sense — no cookie-based session exists for a CSRF token to
  protect; Bearer-token auth already requires the calling page's JS to possess the token, which a
  cross-site page cannot obtain without an XSS or the CORS allowlist gap above (now closed).

---

## Database — query-level authorization review

Went through every controller touching `customerId`/`tenantId`/`restaurantId`/`orderId` across all
~30 route modules (with two dedicated sub-audits covering all of them). Confirmed-safe modules,
already correctly scoped and not modified: `customer_address`, `checkout_payment`, `discount_coupon`,
`combo_offer`, `tax_config`, `vendor` (after the mass-assignment fix), `inventory`, `table`,
`expense_entry` (after the mass-assignment fix), `activity_log`, `Ai_Ml`, `qrcode`, `setting`,
`tenant` (already had a solid `isAdmin || id === user.tenantId` pattern worth pointing to as the
house style for this kind of check). Every gap found in the rest is documented above.

---

## Known limitations / recommendations for the team (not fixed in this pass)

- **`forgotPassword` is disabled, not replaced.** A real fix needs a single-use, short-expiry reset
  token emailed as a link (never the password itself) — a real feature to design and build, not a
  one-line patch, and it wasn't wired to the frontend to begin with.
- **`passwordShow` column** should be dropped in a follow-up migration once confirmed no other
  consumer (a POS terminal client, a support tool) depends on it; it's excluded from API responses
  now, but the plaintext still exists at rest in the database.
- **OTP/account enumeration**: `sendOtp` still returns a different response (`404 Customer not
  found`) for a non-existent identifier vs. a real one, which is a mild enumeration signal. Not
  changed in this pass — unifying the response would need a UX decision (the current 404 also
  drives "no account, want to sign up?" messaging), and the per-IP `authLimiter` already meaningfully
  throttles bulk enumeration attempts.
- **Client token storage** is `localStorage` (via `zustand`'s `persist`). No current XSS sink exists
  to exploit this, but moving to `httpOnly` cookies would remove the exposure entirely if the team
  wants defense-in-depth here; it's a larger change (adds CSRF back into scope) so it's called out
  rather than done unilaterally.
- **`disableTenantCheck: true` on an `include`** is a no-op in this codebase's tenant-scoping hook
  (it only reads that flag off the top-level query options). This session found and fixed one place
  this actually mattered (`menu_rating`'s new self-service review-history route). It's worth a
  dedicated pass across the codebase for any other first-level include of a `hasTenantCondition()`
  model that's reachable by a customer token (undefined CLS tenantId) — most existing uses of the
  pattern are on includes nested two or more levels deep, which the hook never reaches anyway
  (regardless of the flag), so they happen to be harmless, but that's incidental, not by design.
- **Tenant self-registration** (`POST /tenant`, intentionally unauthenticated) creates the first
  staff user with a hardcoded default password (`tenant@123`) and no forced-reset-on-first-login
  flow. Low severity (the account is inert until a platform admin approves the tenant via
  `updateStatus`), but worth tightening if self-serve signup volume grows.
- A number of older controllers construct their error response manually
  (`res.status(...).json({ message, error: error.message })`) rather than through the now-fixed
  `common.throwException` helper, so they weren't covered by that one central fix. None of the
  instances found leak more than `error.message` (no stack traces, no full error objects), which is
  a much smaller exposure than the raw DB error text `throwException` used to leak, but a follow-up
  pass to route everything through the shared, now-safe helper would close this consistently.

---

## Checklist — completed

- [x] Customer A cannot access/modify/delete Customer B's orders — verified end-to-end, order
      creation/read/update all scoped to `req.user.id`.
- [x] Customer A cannot access Customer B's profile, addresses, favorites, or reviews — review-
      history IDOR fixed; addresses/points/profile were already correctly scoped.
- [x] Tenant A cannot access/modify Tenant B's restaurant, orders, menu, or customers — fixed across
      user, role, permission, menu_admin, geo_*, report, bill_pdf, groq_chat, order_placement.
- [x] Changing tenantId/restaurantId/customerId/orderId in requests cannot bypass authorization —
      addressed via explicit ownership checks and mass-assignment fixes.
- [x] Customer cannot access tenant-only APIs, tenant cannot access customer-only privileged APIs —
      dual-auth endpoints that were actually tenant-only now require staff auth explicitly.
- [x] Role/userId/tenantId are never trusted from the client where it matters for authorization —
      identity is derived from the verified JWT (`req.user`) throughout; the remaining
      client-supplied `tenantId` values (e.g. which restaurant a customer is ordering from) are
      legitimate user choices, not identity claims, and are validated against real data before use.
- [x] Item price/total/discount/payment status are always server-computed — verified in the Razorpay
      flow (already correct) and the counter/dine-in flow (menu-mixing gap fixed).
- [x] Razorpay payment/order/signature verified server-side; webhook trust boundary is the HMAC
      signature, not a customer token; no secret keys ever returned to the client; no card/CVV data
      collected or stored — all confirmed already correct.
- [x] OTP expiration, max attempts, resend rate limiting, invalidation-after-use, no reuse — all
      added; brute-force is bounded by attempt cap + expiry + per-IP rate limit together.
- [x] JWT validation, token expiration, invalid/expired token handling, password hashing — already
      correct; logout/session invalidation added (previously missing entirely).
- [x] Mass assignment on profile/update APIs swept for role/permissions/tenantId/customerId/
      isAdmin/paymentStatus/accountStatus — two real findings, both fixed.
- [x] SQL/NoSQL injection, XSS, path traversal — swept, findings fixed (raw-literal decrement, file
      upload path traversal, bill PDF path).
- [x] File upload MIME + extension validation, size limit, random server-generated filenames,
      original filename never trusted — fixed centrally for all four upload endpoints.
- [x] Every protected endpoint checked for authentication, authorization, ownership, tenant
      isolation — swept across all ~30 route modules via two independent deep-dive passes plus this
      session's own direct review of the modules they didn't cover (`menu`, order flows, payments).
- [x] API responses don't expose passwords/hashes/OTPs/secrets — `passwordShow` and `otp` now
      excluded from default model scope; raw internal error detail no longer returned in production.
- [x] CORS tightened (wildcard PaaS-domain trust removed); HTTPS/headers reviewed (helmet already
      correct); cookies not applicable (Bearer-token auth only); CSRF not applicable for the same
      reason.
- [x] Database queries involving customerId/tenantId/restaurantId/orderId reviewed for
      query-level authorization across every module.
