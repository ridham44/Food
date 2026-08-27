# CHPL POS Backend (chpl-food-backend)

Multi-tenant Point-of-Sale (POS) backend for food/restaurant businesses. Built with Node.js, Express, and Sequelize (MySQL), it powers menu & order management, billing, payments, loyalty/discounts, vendor & expense tracking, reporting, and AI-assisted features (sales forecasting, chat assistants).

## Tech Stack

- **Runtime:** Node.js, Express 4
- **Database:** MySQL via Sequelize ORM (migrations & seeders under `app/db`)
- **Auth:** JWT (`jsonwebtoken`), role & permission based access control
- **Real-time:** Socket.io (available, currently disabled in `server.js`)
- **Docs:** Swagger / OpenAPI (`swagger-ui-express`, `swagger-autogen`)
- **Jobs:** `node-schedule` / `cron` for scheduled tasks (`schedule/`)
- **Integrations:** Razorpay, Stripe (payments), SendGrid & Nodemailer (email), Firebase Admin (push notifications), Google APIs, Groq (AI chat), IMAP/POP3/mailparser (email sync), QR code generation, PDF generation (`pdfkit`), Excel export (`exceljs`)
- **Other:** Winston (logging, with daily rotation), Morgan (access logs), Helmet/CORS/compression, `express-rate-limit`, `express-validator`

## Project Structure

```
app/
  db/
    models/            # Sequelize models (User, Tenant, Role, Menu, Order, Payment, Vendor, ...)
    migrations/         # Sequelize migrations
    seeders/            # Sequelize seeders
    audit-logger/       # Request/response audit logging (context via cls-hooked)
    config/config.json  # Sequelize DB config (per NODE_ENV)
  middlewares/
    middleware.js              # Admin/staff JWT auth
    CustomerMiddlewear.js       # Customer/tenant JWT auth
    permission.middleware.js    # Permission checks
    roleBasedMiddleware.js      # Role/menu-key based access control
  routes_controller/    # One folder per feature module, each with index.js (routes) + lib/ (controller, validation, service)
    auth/ user/ tenant/ role/ permission/
    menu/ menu_admin/ menu_rating/ combo_offer/ discount_coupon/
    order_placement/ order_payment/ bill_pdf/ qrcode/
    Customer_points/ expense_entry/ vendor/ tax_config/
    geo_country/ geo_state/ geo_city/ setting/ activity_log/ report/
    groq_chat/ Ai_Ml/
docs/
  swagger.js / swagger.json   # OpenAPI spec, served at /api-docs (non-production only)
schedule/
  index.js               # Cron/scheduled job registrations
scripts/
  generate-modules.js    # Generates a module/permission hierarchy JSON from DB
  bulk-import/           # Bulk data import helpers
utils/
  index.js               # Shared HTTP status codes, etc.
  lib/                    # Shared services: email, SMS/WhatsApp (11za), MyOperator, Firebase push,
                          # Groq client, common/db helper functions, DevExtreme-style filters, enums, logger
server.js                # App bootstrap (Express app, DB connection, middleware, routes)
```

## Key Features

- **Multi-tenant architecture** — tenants, users, roles and permissions scoped per tenant, with an audit-logging layer (`app/db/audit-logger`) using `cls-hooked` request-scoped context.
- **Menu management** — menus, menu admin config, combo offers, menu ratings.
- **Order lifecycle** — order placement, order items/bills, order payments (Razorpay/Stripe), bill PDF generation, QR code based ordering.
- **Loyalty & promotions** — customer points, discount coupons.
- **Vendor & expense management** — vendor/vendor-item records, expense entries.
- **Tax configuration** — configurable tax rules per tenant.
- **Geo data** — countries/states/cities reference data.
- **Reporting** — reporting endpoints for sales/operations insight.
- **AI features** — sales forecasting (`Ai_Ml`) and role-aware AI chat assistants for orders/tenant/admin/customer (`groq_chat`, powered by Groq).
- **RBAC** — role-based and menu-key based permission middleware for fine-grained access control.
- **Notifications** — email (SendGrid/Nodemailer/Gmail), WhatsApp/SMS (11za), voice/IVR (MyOperator), and Firebase push notifications.
- **API documentation** — Swagger UI at `/api-docs` (development only).

## Detailed Functionality (Module-by-Module API Reference)

All routes below are mounted under the base path **`/api/v1`** (e.g. `/menu` → `/api/v1/menu`). Each module lives in `app/routes_controller/<module>/` with `index.js` (routes), `lib/controller.js`, `lib/validation.js`, and sometimes `lib/service.js`.

**Auth column legend:**
- **Public** — no token required
- **Staff** — `app/middlewares/middleware.js` (admin/tenant-staff JWT, signed with `JWT_SECRET_ADMIN`)
- **Customer/Tenant** — `app/middlewares/CustomerMiddlewear.js` (accepts either a `Customer` JWT or a tenant-portal `User` JWT)

### Auth (`auth/`)
Handles login and customer account management.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/login` | Public | Admin/staff login (email + password → JWT) |
| POST | `/change-password` | Staff | Change the logged-in staff user's password |
| POST | `/user/common-filter` | Staff | Filter/search users (e.g. by date range) |
| POST | `/customer-login` | Public | Customer login |
| POST | `/customer-create` | Public | Register a new customer |
| PUT | `/customer-update/:id` | Staff | Update a customer record |
| DELETE | `/customer-delete/:id` | Staff | Delete a customer record |

### User (`user/`)
Staff/admin user accounts, including social login and profile photo upload.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/login/with-password` | Public | Staff login with email/password |
| POST | `/login/with-auth` | Public | Social login (e.g. Google/Facebook, see `SocialLogin` enum) |
| POST | `/user` | Staff | Create a user (with optional profile image upload) |
| POST | `/user-filter` | Staff | Paginated/filtered user listing |
| GET | `/user-filter/options` | Staff | Get filter dropdown options for users |
| GET | `/user/:id` | Staff | Get a user by ID |
| PUT | `/user/:id` | Staff | Update a user (with optional profile image upload) |
| PUT | `/user/status/:id` | Staff | Activate/deactivate a user |
| DELETE | `/user/:id` | Staff | Delete a user |
| PUT | `/profile/change-password` | Staff | Change own password |
| PUT | `/forgot-password` | Public | Reset a forgotten password |

### Tenant (`tenant/`)
Onboards and manages tenant (restaurant/outlet) records, including KYC-style front/back document image uploads.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/tenant` | Public | Create/onboard a tenant (uploads `frontImage`/`backImage`) |
| PUT | `/tenant/:id` | Staff | Update a tenant (with image uploads) |
| DELETE | `/tenant/:id` | Staff | Delete a tenant |
| GET | `/tenant` | Staff | List all tenants |
| GET | `/tenant/:id` | Staff | Get a tenant by ID |
| GET | `/tenant-filter/options` | Staff | Tenant filter dropdown options |
| POST | `/tenant-filter` | Staff | Filtered/paginated tenant listing |
| PUT | `/tenant/status/:id` | Staff | Approve/reject/activate a tenant (see `StatusTenantAndStore` enum) |
| GET | `/tenant/by-user/:userId` | Staff | List tenants created by a specific user |
| POST | `/tenant/filter` | Staff | Filter tenants by date |

### Role (`role/`)
Role definitions used for RBAC (e.g. Admin, Tenant staff).
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/role` | Staff | Create a role |
| PUT | `/role/:id` | Staff | Update a role |
| DELETE | `/role/:id` | Staff | Delete a role |
| GET | `/role` | Staff | List all roles |
| GET | `/role-filter/options` | Staff | Role filter dropdown options |
| POST | `/role-filter` | Staff | Filtered/paginated role listing |
| PUT | `/role/status/:id` | Staff | Activate/deactivate a role |
| GET | `/role/:id` | Staff | Get a role by ID |
| POST | `/role/filter` | Staff | Filter roles by date |

### Permission (`permission/`)
Maps roles to admin menu items to control feature access (used by `roleBasedMiddleware`).
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/permission` | Staff | Create a permission (role ↔ menu link) |
| PUT | `/permission/:id` | Staff | Update a permission |
| DELETE | `/permission/:id` | Staff | Delete a permission |
| GET | `/permission` | Staff | List all permissions |
| GET | `/permission/:id` | Staff | Get a permission by ID |
| POST | `/permission-filter` | Staff | Filtered/paginated permission listing |
| GET | `/permission-filter/options` | Staff | Permission filter dropdown options |

### Menu Admin (`menu_admin/`)
Configures the admin-side navigation/module hierarchy (used to derive permission "menu keys").
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/menu-admin` | Staff | Create an admin menu entry |
| PUT | `/menu-admin/:id` | Staff | Update an admin menu entry |
| DELETE | `/menu-admin/:id` | Staff | Delete an admin menu entry |
| GET | `/menu-admin` | Staff | List all admin menu entries |
| GET | `/menu-admin-filter/options` | Staff | Filter dropdown options |
| POST | `/menu-admin-filter` | Staff | Filtered/paginated listing |
| PUT | `/menu-admin/status/:id` | Staff | Activate/deactivate an entry |
| GET | `/menu-admin/:id` | Staff | Get an admin menu entry by ID |

### Menu (`menu/`)
The restaurant's food/product catalog, with image upload and a public customer-facing view.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/menu` | Staff | Create a menu item (uploads `filePath` image) |
| PUT | `/menu/:id` | Staff | Update a menu item (with image upload) |
| DELETE | `/menu/:id` | Staff | Delete a menu item |
| GET | `/menu` | Staff | List all menu items |
| GET | `/menu/:id` | Staff | Get a menu item by ID |
| POST | `/menu-filter` | Staff | Filtered/paginated menu listing |
| GET | `/menu-filter/options` | Staff | Filter dropdown options |
| POST | `/menu/filter` | Staff | Filter menu items by date |
| GET | `/menu-customer/:tenantId` | Customer/Tenant | Get a tenant's menu for the customer-facing app |
| PUT | `/menu/status/:id` | Staff | Toggle item availability (in-stock/out-of-stock) |

### Combo Offer (`combo_offer/`)
Bundled/combo deals made up of multiple menu items.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/combo/group` | Customer/Tenant | Create a combo group |
| PUT | `/combo/group/:id` | Customer/Tenant | Update a combo group |
| PUT | `/combo/group-item/:id` | Customer/Tenant | Update an item within a combo group |
| POST | `/combo/group-item` | Customer/Tenant | Add an item to a combo group |
| DELETE | `/combo/group-item/:id` | Customer/Tenant | Remove an item from a combo group |
| DELETE | `/combo/:id` | Customer/Tenant | Delete a combo |
| GET | `/combo-list` | Customer/Tenant | List all combos |
| GET | `/combo/:id` | Customer/Tenant | Get a combo by ID |
| PUT | `/combo/status/:id` | Customer/Tenant | Activate/deactivate a combo |

### Menu Rating (`menu_rating/`)
Customer reviews/ratings for menu items.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/menu-rating` | Customer/Tenant | Submit a review/rating for a menu item |
| POST | `/menu-rating/report` | Customer/Tenant | Aggregate rating report |
| GET | `/menu-rating/report/:menuId` | Customer/Tenant | Review details for a specific menu item |
| GET | `/menu-rating/report-combo` | Customer/Tenant | Rating report for combos |
| GET | `/menu-rating/:customerId` | Customer/Tenant | A customer's review history |
| GET | `/menu-rating/count/:menuId` | Customer/Tenant | Rating distribution (star counts) for a menu item |

### Discount Coupon (`discount_coupon/`)
Coupon codes for discounts.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/coupon` | Customer/Tenant | Create a discount coupon |
| POST | `/redeem-coupon` | Customer/Tenant | Redeem a coupon on an order |
| PUT | `/coupon/:id` | Customer/Tenant | Update a coupon |
| PUT | `/coupon/status/:id` | Customer/Tenant | Activate/deactivate a coupon |
| GET | `/coupon/report` | Customer/Tenant | Report of all coupons issued |
| GET | `/coupon/report/:id` | Customer/Tenant | Details/usage of a specific coupon |

### Customer Points (`Customer_points/`)
Loyalty points program.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/test` | Public | Test/dev endpoint to assign points |
| POST | `/redeem-points` | Customer/Tenant | Redeem loyalty points |
| POST | `/points/balance` | Customer/Tenant | Get a customer's points balance |
| GET | `/points/history/:customerId` | Customer/Tenant | Points earn/redeem history |
| GET | `/points/top-customers` | Staff | Leaderboard of top point holders |

### Order Placement (`order_placement/`)
Core order lifecycle: cart, placement, approval, reordering.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/order/customer` | Customer/Tenant | Customer places a new order for a tenant |
| POST | `/order/approve-or-reject` | Customer/Tenant | Tenant approves or rejects an incoming order |
| POST | `/order/tenant` | Customer/Tenant | Tenant places an order on behalf of a customer (e.g. walk-in) |
| POST | `/order/order-item-quantity` | Customer/Tenant | Update the quantity of an item on an order |
| POST | `/order/item` | Customer/Tenant | Add an item to an existing order |
| POST | `/order/prev` | Customer/Tenant | Reorder from a previous order |

### Order Payment (`order_payment/`)
Bill settlement and payment reporting.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/payment/bill` | Customer/Tenant | Get a customer's unpaid bills |
| POST | `/payment/pay` | Customer/Tenant | Pay a bill by ID (cash/Razorpay/Stripe) |
| POST | `/payment/type-report` | Customer/Tenant | Report of payments grouped by payment mode |
| POST | `/payment/overview` | Customer/Tenant | Totals/overview across payment modes |

### Bill PDF (`bill_pdf/`)
Generates printable invoices.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/bill-pdf` | Staff | Generate an invoice/bill PDF for an order (via `pdfkit`) |

### QR Code (`qrcode/`)
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| GET | `/generate-login-qr` | Public | Generate a QR code (e.g. table/login QR for the customer app) |

### Expense Entry (`expense_entry/`)
Tracks tenant business expenses and related reports.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/expense-entry` | Staff | Record a new expense |
| GET | `/expense-entry` | Staff | List all expenses |
| PUT | `/expense-entry/:id` | Staff | Update an expense |
| DELETE | `/expense-entry/:id` | Staff | Delete an expense |
| POST | `/expense-entry/category` | Staff | Expense totals grouped by category |
| POST | `/expense-entry/detail` | Staff | Detailed grouped expense report |
| POST | `/expense-entry/date` | Staff | Expense report grouped by date |
| POST | `/expense-entry/payment` | Staff | Expense report grouped by payment mode |

### Vendor (`vendor/`)
Supplier/vendor management and the items supplied.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/vendor` | Staff | Create a vendor |
| GET | `/vendor` | Staff | List all vendors |
| PUT | `/vendor/:id` | Staff | Update a vendor |
| DELETE | `/vendor/:id` | Staff | Delete a vendor |
| GET | `/vendor/:id` | Staff | Get a vendor by ID |
| PATCH | `/vendor/status/:id` | Staff | Activate/deactivate a vendor |
| POST | `/vendor/summary-report` | Staff | Vendor summary report |
| POST | `/vendor-item` | Staff | Create an item supplied by a vendor |
| GET | `/vendor-item/:id` | Staff | Get a vendor item by ID |
| PUT | `/vendor-item/:id` | Staff | Update a vendor item |
| DELETE | `/vendor-item/:id` | Staff | Delete a vendor item |
| GET | `/vendor-item/get-all/:id` | Staff | List all items for a given vendor |

### Tax Config (`tax_config/`)
Per-tenant tax rules (e.g. GST) and packing fees.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/tax-config` | Staff | Create a tax configuration |
| PUT | `/tax-config/:id` | Staff | Update a tax configuration |
| DELETE | `/tax-config/:id` | Staff | Delete a tax configuration |
| GET | `/tax-config` | Staff | List all tax configurations |
| GET | `/tax-config/:id` | Staff | Get a tax configuration by ID |
| PUT | `/tax-config/status/:id` | Staff | Activate/deactivate a tax configuration |
| GET | `/tax-config/report-all` | Staff | Tax policy report across all tenants (admin/superadmin) |
| POST | `/tax-config/report-summary` | Staff | Tax summary for a specific tenant |
| POST | `/tax-config/packing-fees` | Staff | Packing fee summary |

### Geo: Country / State / City (`geo_country/`, `geo_state/`, `geo_city/`)
Reference/master data for addresses, with cascading lookups (state by country, city by state) and country flag image upload.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/country` \| `/state` \| `/city` | Staff | Create (country upload accepts a `flag` image) |
| PUT | `/country/:id` \| `/state/:id` \| `/city/:id` | Staff | Update |
| DELETE | `/country/:id` \| `/state/:id` \| `/city/:id` | Staff | Delete |
| GET | `/country` \| `/state` \| `/city` | Staff | List all |
| GET | `/country/:id` \| `/state/:id` \| `/city/:id` | Staff | Get by ID |
| GET | `/country/options` \| `/state/options` \| `/city/options` | Staff | Dropdown options |
| GET | `/state/cascade/:id` \| `/city/cascade/:id` | Staff | Cascading lookup (states for a country / cities for a state) |
| PUT | `/country/status/:id` \| `/state/status/:id` \| `/city/status/:id` | Staff | Activate/deactivate |
| POST | `/country-filter` \| `/state-filter` \| `/city-filter` | Staff | Filtered/paginated listing |
| GET | `/country-filter/options` \| `/state-filter/options` \| `/city-filter/options` | Staff | Filter dropdown options |
| POST | `/country/filter` \| `/state/filter` \| `/city/filter` | Staff | Filter by date |

### Setting (`setting/`)
Tenant/application-level configuration key-values.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/setting` | Staff | Create a setting |
| PUT | `/setting/:id` | Staff | Update a setting |
| DELETE | `/setting/:id` | Staff | Delete a setting |
| GET | `/setting` | Staff | List all settings |
| GET | `/setting-filter/options` | Staff | Filter dropdown options |
| POST | `/setting-filter` | Staff | Filtered/paginated listing |
| PUT | `/setting/status/:id` | Staff | Activate/deactivate a setting |
| GET | `/setting/:id` | Staff | Get a setting by ID |
| GET | `/setting/by-user/:userId` | Staff | Settings created by a specific user |
| POST | `/setting/filter` | Staff | Filter settings by date |

### Activity Log (`activity_log/`)
Audit trail of user/system actions (backed by `app/db/audit-logger`).
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/activityLog` | Staff | Query/list activity log entries |

### Report (`report/`)
Cross-cutting sales and operations analytics.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/report/summary-date` | Customer/Tenant | Daily/weekly/monthly order summary |
| POST | `/report/most-sold` | Customer/Tenant | Most-sold menu items in a date range |
| GET | `/report/combo-orders` | Customer/Tenant | Most-ordered combos report |
| GET | `/report/category` | Customer/Tenant | Orders broken down by menu category |
| GET | `/report/unpaid-orders` | Customer/Tenant | All unpaid orders |
| POST | `/report/orders` | Customer/Tenant | Full order details (filtered) |
| GET | `/report/cancel-order` | Customer/Tenant | All cancelled orders |
| GET | `/report/orders/:tenantId` | Customer/Tenant | A customer's previous orders for a tenant (used for reordering) |
| POST | `/report/revenue-vs-expense` | Customer/Tenant | Revenue vs. expense breakdown |

### AI / ML (`Ai_Ml/`)
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/sales-forecast` | Staff | Predict future sales using historical order data |

### Groq Chat (`groq_chat/`)
Conversational AI assistants (via `utils/lib/groqClient.js`) scoped to different audiences/data contexts.
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| POST | `/ask-order-ai` | Staff | Ask an AI assistant questions about orders |
| POST | `/ask-tenant-ai` | Staff | Ask an AI assistant questions scoped to tenant data |
| POST | `/ask-admin-ai` | Staff | Ask an AI assistant questions scoped to admin/platform data |
| POST | `/ask-customer-ai` | Customer/Tenant | Customer-facing AI chat assistant |

## Shared Utilities (`utils/lib/`)

- **`common-function.js`** — shared helpers, including the `expressValidate` middleware that turns `express-validator` results into a standard error response.
- **`db-common-function.js`** — generic Sequelize helpers (e.g. reusable create/update/find/soft-delete logic used across controllers).
- **`find-with-filters.js` / `dev-extreme-filters.js`** — generic, DevExtreme-grid-style dynamic filtering/pagination/sorting used by the many `*-filter` endpoints.
- **`enums.js`** — shared enums: status, login state, device type, role type, email type/social login provider, form field types, menu order type, tenant/store approval status, etc.
- **`emailService.js` / `sendGrid.js`** — outbound transactional email (Nodemailer/Gmail OAuth and SendGrid).
- **`oneonezaService.js`** — WhatsApp/SMS messaging via the 11za API.
- **`myOperatorService.js`** — voice/IVR/call integration via MyOperator.
- **`firebasePushNotificationService.js`** — push notifications via Firebase Admin SDK.
- **`groqClient.js`** — client for the Groq AI API used by the `groq_chat` and `Ai_Ml` modules.
- **`razorpay.js` / `stripe.js`** — payment gateway client setup.
- **`logger.js`** — Winston logger with daily-rotating file transport.
- **`defaultRoles.js` / `foreignKeyModal.js` / `modules.js`** — bootstrap/reference data for roles, FK metadata, and the module hierarchy used by `scripts/generate-modules.js`.
- **`hooks/`, `auditLog/`** — Sequelize lifecycle hooks and audit-log helpers.
- **`messages/`, `templates/`** — shared message strings and email/HTML templates (e.g. `handlebars`-based).

## Background Jobs & Scripts

- **`schedule/index.js`** — registers cron/scheduled jobs at boot (currently commented out; scaffold for periodic sync/notification jobs using `node-schedule`).
- **`scripts/generate-modules.js`** — reads the `MenuAdmin`/module hierarchy from the DB and writes a flattened `{ moduleKey: id }` JSON file, used to reference permission menu keys in code.
- **`scripts/bulk-import/`** — one-off scripts/data files for bulk-importing records (e.g. geo or menu master data).

## Prerequisites

- Node.js (LTS) and npm
- MySQL database

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `env.sample` to `.env` and fill in the required values (DB credentials, JWT secrets, payment gateway keys, email/SMS provider keys, etc.). See [Environment Variables](#environment-variables) below.
3. Configure the database connection in `app/db/config/config.json` (or via env, depending on your setup) and ensure the MySQL database exists.
4. Run migrations (and seeders, if needed):
   ```bash
   npx sequelize-cli db:migrate
   npx sequelize-cli db:seed:all
   ```
5. Start the server:
   ```bash
   npm start        # node server.js
   npm run server   # nodemon server.js (auto-reload for development)
   ```

The server listens on `PORT` from `.env` (defaults to `5000`). The root route (`GET /`) returns a simple health-check JSON.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm start` | Start the server with Node |
| `npm run server` | Start the server with Nodemon (dev, auto-restart) |
| `npm run lint` | Run ESLint (with `--fix`) across the project |
| `npm run format` | Format the codebase with Prettier |
| `npm run swagger` | Regenerate `docs/swagger.json` via `swagger-autogen` |
| `npm run modules` | Generate the module/permission hierarchy JSON via `scripts/generate-modules.js` |

## Environment Variables

Defined in `env.sample` (copy to `.env`). Key variables:

- `NODE_ENV`, `PORT`
- `TOKEN_EXPIRE_MAX`, `TOKEN_EXPIRE_MIN` — JWT expiry settings
- `JWT_SECRET_ADMIN`, `JWT_SECRET_CLIENT`, `JWT_SECRET_API` — JWT signing secrets per audience
- `SENDGRID_EMAIL`, `SENDGRID_API_KEY` — transactional email
- `RAZORPAY_KEY`, `RAZORPAY_SECRET`, `RAZORPAY_WEBHOOKS_SECRET` — Razorpay payments
- `STRIPE_PUBLISH_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOKS_SECRET` — Stripe payments
- `CHPL_API_URL`, `ONEONEZA_API_URL`, `MYOPERATOR_API_URL`, `MYOPERATOR_RECORDINGS_URL`, `GRAPH_API_URL` — third-party API integrations (CRM, WhatsApp/SMS, IVR, Meta Graph API)
- `CLOUDFLARED_URL` — tunnel/public URL for local dev
- `CORS_ALLOW_TENNAT_URL`, `TENANT_VERIFY_TOKEN` — multi-tenant CORS/verification
- `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET` — Gmail OAuth (email sync via IMAP)

Never commit real secrets — keep actual values only in your local `.env`.

## Authentication & Authorization

- **Admin/staff users:** `app/middlewares/middleware.js` verifies a JWT (signed with `JWT_SECRET_ADMIN`) and loads the user with their `Role` and `Tenant`.
- **Customers/tenant portal:** `app/middlewares/CustomerMiddlewear.js` verifies the JWT and resolves either a `Customer` or a tenant-scoped `User`.
- **Fine-grained access:** `permission.middleware.js` and `roleBasedMiddleware.js` check role/menu-key permissions (backed by the `Permission` and `MenuAdmin` models) before allowing access to a route.

## API Documentation

When `NODE_ENV !== 'production'`, Swagger UI is served at `/api-docs`, backed by `docs/swagger.json`. Regenerate it with `npm run swagger` after adding/changing routes.

## Logging

- HTTP access logs are written to `access.log` (via Morgan) and rotated logs live under `access-logs/`.
- Application logging uses Winston (`utils/lib/logger.js`) with daily rotation.
- API request/response auditing is handled by `app/db/audit-logger`.
