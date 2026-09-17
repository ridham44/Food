# OrbitFood

OrbitFood is a food ordering system for restaurants — think of it as a small,
private version of Zomato/Swiggy that a company can run for its own
restaurant(s). One website serves three different kinds of people, and each
one sees a different, simple dashboard made just for them.

## The three types of users

### 1. Admin (platform owner)
The Admin is the owner of the whole OrbitFood system. They don't run a
restaurant themselves — they manage the restaurants (tenants) that use the
platform.
- Add/view all restaurants (tenants) on the platform
- See platform-wide reports (sales, activity, usage)
- Manage overall settings

### 2. Tenant (restaurant / business owner)
Each restaurant that signs up is a "tenant." Every tenant gets their own
private dashboard to run their restaurant, completely separate from other
restaurants on the platform.
- **Menu** — add/edit dishes, categories, prices, photos, combos, and offers
- **Orders & Kitchen** — see incoming orders live and update their status
  (received → preparing → ready → served)
- **Tables & QR codes** — generate a QR code per table so dine-in customers
  can scan and order from their phone; also supports takeaway/delivery orders
- **Staff** — add waiters/staff with their own logins and limited permissions
  (roles: manager, waiter, etc.)
- **Customers** — see who's ordering from them and their order history
- **Inventory & Vendors** — track stock and the suppliers they buy from
- **Coupons & Discounts** — create discount codes and special offers
- **Expenses** — log day-to-day restaurant expenses
- **Billing & Payments** — generate bills/invoices and record payments
- **Reports & Activity Log** — sales reports and a history of actions taken
  in their account (for accountability)
- **Restaurant & profile settings** — business details, tax settings, etc.

### 3. Customer
The people who actually order and eat the food.
- Sign in with just their mobile number (OTP, no password needed)
- Browse restaurants and their menus
- Add items to a cart and place an order (dine-in via table QR code,
  takeaway, or delivery to a saved address)
- Track an order's live status
- Reorder a past order in one tap
- Save multiple delivery addresses
- Rate and review dishes
- Earn and track loyalty points
- Manage their profile

## AI Assistant — "Alica"
Every portal (Admin, Tenant, and Customer) has a built-in AI chat assistant
called Alica that can answer questions relevant to that specific user — for
example, a tenant can ask about their sales, while a customer can ask about
their order status.

## Project structure
- [`orbitfood-backend/`](orbitfood-backend/) — the server that stores data and powers the app
- [`orbitfood-frontend/`](orbitfood-frontend/) — the website itself (Admin, Tenant, and Customer portals all in one app)

## Tech stack (for developers)
- Backend: Node.js/Express + Sequelize (PostgreSQL/MySQL)
- Frontend: Vite + React/TypeScript
