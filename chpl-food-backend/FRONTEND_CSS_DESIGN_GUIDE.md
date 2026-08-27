# CHPL Food POS — Frontend CSS & Design Guide

This guide is the visual contract for the frontend. Build a premium, dark, glassmorphism POS experience: calm, highly readable, responsive, and operationally fast. It should feel like a product refined by a small experienced team—not a template with blur added everywhere.

## 1. Design Direction

**Theme:** premium dark glassmorphism with deep navy backgrounds, restrained violet/cyan light, crisp typography, and warm food imagery.

**Product feeling:** modern restaurant operations software—confident, clean, useful. The interface must remain easy to scan during busy service hours.

**Key rules**

- Use glass surfaces selectively for shell, cards, menus, and dialogs. Do not put every small element inside a translucent card.
- Keep high contrast for text, table rows, order statuses, and primary actions; visual style must never reduce operational clarity.
- Use one primary accent (violet) and one data/interactive accent (cyan). Reserve green, amber, and red strictly for state/meaning.
- Prefer generous whitespace, 8px spacing rhythm, soft borders, and purposeful animation.
- Never use pure black backgrounds or pure white text across large UI areas.

## 2. Color System

### Core colors

| Token | Value | Use |
| --- | --- | --- |
| `--bg-base` | `#080B14` | Page background |
| `--bg-deep` | `#0D1220` | Sidebar / deepest surface |
| `--bg-elevated` | `#151B2D` | Solid fallback surfaces |
| `--surface-glass` | `rgba(21, 27, 45, 0.68)` | Primary glass cards/panels |
| `--surface-glass-strong` | `rgba(25, 32, 53, 0.84)` | Header, modal, dropdown |
| `--surface-hover` | `rgba(125, 92, 255, 0.12)` | Hovered navigation/rows |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)` | Default glass border |
| `--border-active` | `rgba(151, 130, 255, 0.48)` | Focus / selected border |
| `--text-primary` | `#F3F5FF` | Main headings/body text |
| `--text-secondary` | `#B3B9CC` | Supporting text |
| `--text-muted` | `#747B93` | Labels, helper text, disabled content |
| `--primary` | `#8B6CFF` | Main CTA / active navigation |
| `--primary-hover` | `#A58DFF` | Primary hover |
| `--primary-deep` | `#6246D8` | Pressed / gradient end |
| `--cyan` | `#35D4E7` | Links, info, charts, secondary emphasis |
| `--success` | `#38D996` | Paid, approved, available |
| `--warning` | `#FFB84D` | Pending, low stock, caution |
| `--danger` | `#FF647C` | Rejected, delete, error |
| `--info` | `#58A6FF` | Neutral progress/status |

### Background treatment

Use a layered page background, not a flat color. Add two blurred radial glows: violet near the top-left and cyan near the lower-right. Keep them subtle so tables and text remain readable.

```css
:root {
  --bg-base: #080b14;
  --bg-deep: #0d1220;
  --surface-glass: rgba(21, 27, 45, 0.68);
  --surface-glass-strong: rgba(25, 32, 53, 0.84);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-active: rgba(151, 130, 255, 0.48);
  --text-primary: #f3f5ff;
  --text-secondary: #b3b9cc;
  --text-muted: #747b93;
  --primary: #8b6cff;
  --primary-hover: #a58dff;
  --primary-deep: #6246d8;
  --cyan: #35d4e7;
  --success: #38d996;
  --warning: #ffb84d;
  --danger: #ff647c;
  --info: #58a6ff;
}

body {
  min-height: 100vh;
  color: var(--text-primary);
  background:
    radial-gradient(circle at 8% 5%, rgba(119, 84, 255, 0.20), transparent 30rem),
    radial-gradient(circle at 92% 90%, rgba(53, 212, 231, 0.11), transparent 32rem),
    var(--bg-base);
}
```

## 3. Typography

- **Font:** `Inter` for application text. Use `Manrope` only for display headings if a second font is desired.
- **Numbers:** Enable tabular numerals for POS totals, prices, dates, and reporting tables: `font-variant-numeric: tabular-nums;`.
- **Body size:** 14–16px. Do not use 12px for operational data except compact metadata.
- **Headings:** 28–32px page heading, 20–24px section heading, 16–18px card title.
- Use sentence case: “Order overview”, not “ORDER OVERVIEW”.

## 4. Layout and Spacing

Use an 8px spacing grid.

| Token | Value | Typical use |
| --- | --- | --- |
| `--space-1` | `4px` | Icon/text micro gap |
| `--space-2` | `8px` | Compact controls |
| `--space-3` | `12px` | Form label/input gap |
| `--space-4` | `16px` | Card padding on mobile |
| `--space-5` | `20px` | Component spacing |
| `--space-6` | `24px` | Card padding / section gap |
| `--space-8` | `32px` | Major section gap |
| `--space-10` | `40px` | Desktop page spacing |

### Application shell

- Desktop sidebar: 252–272px wide, fixed/sticky, dark solid-to-glass surface.
- Top bar: 72px high, frosted glass, sticky with a thin bottom border.
- Main content: 24px mobile padding, 32px desktop padding, maximum content width around 1600px.
- Dashboard cards: responsive grid with a minimum width of 220px; avoid manually fixed card widths.
- Customer ordering app: bottom navigation on mobile; never force the restaurant admin sidebar into the customer experience.

## 5. Glass Surface Recipe

Use this base class for panels. Verify the browser supports `backdrop-filter`; it must also look good without it.

```css
.glass-panel {
  background: var(--surface-glass);
  border: 1px solid var(--border-subtle);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.035);
  backdrop-filter: blur(18px) saturate(135%);
  -webkit-backdrop-filter: blur(18px) saturate(135%);
}

.glass-panel--strong {
  background: var(--surface-glass-strong);
  border: 1px solid rgba(255, 255, 255, 0.11);
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.30);
}
```

### Radius

- Inputs, chips, small controls: `10px`
- Buttons: `10px` or `12px`
- Cards: `16px`
- Dialogs and feature hero panels: `20px`
- Avoid excessive pill shapes. Pills are for tags, filters, and compact status labels only.

## 6. Components

### Buttons

- Primary: violet gradient (`#8B6CFF` → `#6246D8`), white text, modest violet shadow.
- Secondary: glass background with subtle border.
- Ghost: transparent, used only for lower-priority actions.
- Destructive: dark red-tinted surface; do not use red as the default button color.
- Minimum target height: 40px desktop, 44px on touch screens.
- Every button needs hover, active, loading, focus-visible, and disabled states.

### Inputs and forms

- Input background: `rgba(8, 11, 20, 0.45)`.
- On focus, use violet border plus a soft outer ring; never rely on color change alone.
- Labels are always visible above fields. Placeholder text is guidance, not a label.
- Error text uses `--danger` with an icon/message beneath the relevant input.
- Split large forms into logical sections/cards; do not present a wall of fields.

### Tables

- Use glass container with an opaque-enough header for legibility.
- Make primary identifiers visually strong: order number, customer name, food item, amount.
- Right-align currency and numerical columns; use tabular numerals.
- Keep row action menus inside a three-dot menu instead of filling the table with buttons.
- On mobile, turn dense tables into stacked order cards or provide horizontal scroll with a visible affordance.

### Status badges

Use compact, text-labelled badges—not color-only dots.

| State | Styling |
| --- | --- |
| Paid / Approved / Available | green tinted surface + green text |
| Pending / Preparing | amber tinted surface + amber text |
| Cancelled / Rejected / Failed | red tinted surface + red text |
| Processing / New | blue or cyan tinted surface + matching text |

### Empty, loading, and error states

- Empty states must say what is missing and include the next action, e.g. “No menu items yet” + “Add menu item”.
- Use skeletons for cards and tables; do not leave large blank areas while loading.
- Error panels should state the problem plainly and include Retry where possible.

## 7. Page-Specific Design

### Restaurant dashboard

- First row: four compact KPI cards—sales, orders, pending orders, unpaid amount.
- Second row: revenue trend chart (wide) plus payment breakdown (narrow).
- Third row: recent orders table and most-sold items list.
- Use chart colors consistently: violet for revenue, cyan for orders, green for paid; never use rainbow charts.

### Orders and POS

- Order status is always visible at top of order detail.
- POS page works with a two-column desktop layout: menu/catalog left, cart/payment right.
- Cart/payment column should remain sticky on larger screens.
- Clearly separate total, tax, discount, packing fee, and grand total.
- The approval/rejection actions require confirmation only when an action cannot be undone.

### Menu management

- Card/grid browsing for visual food catalog; table view for bulk management.
- Image upload should show preview, replace, and remove states.
- Availability needs a prominent toggle and plain “Available / Out of stock” label.

### Customer ordering app

- More vibrant and image-led than the admin portal, while retaining the dark theme.
- Sticky cart summary on mobile; bottom navigation for Menu, Orders, Rewards, Profile.
- Use large food images with 4:3 ratio, visible price, rating, and add-to-cart control.
- Checkout must show all charges before payment.

## 8. Motion and Interaction

- Fast UI feedback: 150–220ms for hover/focus; 220–300ms for panels/dialogs.
- Prefer opacity and transform transitions. Avoid animating layout dimensions when possible.
- Hover cards move no more than `-2px` to `-4px`.
- Respect reduced-motion preferences.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}
```

## 9. Responsive Standards

- Design customer ordering at 360px width first.
- Test admin pages at 1280px, 1024px, 768px, and 375px.
- Hide/collapse the desktop sidebar below 1024px; use a slide-over menu.
- Keep key actions visible without hover because the app will be used on touch devices.
- Do not rely on tiny icons alone—include accessible labels/tooltips.

## 10. Accessibility and Quality Bar

- Meet WCAG AA contrast, especially for muted text on glass panels.
- Every interactive element must have a visible keyboard focus state.
- Use semantic HTML, labels, logical heading order, and accessible dialog behavior.
- Never convey order/payment status by color alone.
- Ensure loading, success, and error feedback is announced appropriately.

## 11. Frontend Technology Stack

Build the frontend as a single **React + TypeScript** application. It will contain the super-admin portal, restaurant POS portal, and customer ordering experience, with role-based routing and shared UI components.

| Area | Technology | Why we use it |
| --- | --- | --- |
| Framework | React + TypeScript | Component-based UI with type safety for a large POS product |
| Build tool | Vite | Fast local development and production builds |
| Routing | React Router | Protected routes, nested portal layouts, role-based navigation |
| Styling | Tailwind CSS | Consistent responsive styling and fast implementation of the design tokens in this guide |
| Reusable UI | Custom UI components built with Radix UI primitives | Accessible dialogs, dropdowns, tabs, tooltips, and popovers without forcing a generic visual theme |
| Server/API state | TanStack Query | API caching, request loading/error states, refetching, and pagination |
| Local UI state | Zustand | Lightweight state for sidebar, user preferences, and POS cart draft |
| Forms | React Hook Form + Zod | Performant forms and shared client-side validation |
| API client | Axios | Central API base URL, JWT attachment, request/response interception, upload support |
| Icons | Lucide React | Consistent, clean SVG icon set |
| Charts | Recharts | Dashboard sales, payment, and performance charts |
| Dates | date-fns | Formatting and date-range calculations without a heavy date library |
| Notifications | Sonner | Compact, accessible success/error toast messages |
| Tables | TanStack Table | Flexible tables for the backend's filtered, paginated admin data |

### Stack decisions

- Use **Tailwind CSS as the primary styling system**. Put the colors, spacing, shadows, and radii from this guide into Tailwind theme tokens. Do not mix Tailwind with a second full design system such as MUI or Ant Design.
- Use custom reusable components (`Button`, `Input`, `GlassPanel`, `Badge`, `Modal`, `DataTable`) so every portal looks like one product.
- Use TanStack Query for all API-owned data. Do not duplicate server records in Zustand/Redux.
- Use Zustand only for small client-side state such as the customer cart, active tenant context, theme preference, sidebar state, and temporary POS selections.
- Centralize API configuration in one Axios client. It must attach the appropriate JWT, gracefully handle `401` / `403`, and support `multipart/form-data` image uploads.
- Begin with polling/refetching for incoming orders. Add Socket.io only after the backend turns it on and exposes the required events.

### Recommended project structure

```text
src/
  app/                 # router, providers, application bootstrapping
  assets/              # logos, fonts, static images
  components/
    ui/                # Button, Input, GlassPanel, Badge, Modal, DataTable
    layout/            # Sidebar, Header, MobileNav, PageHeader
  features/
    auth/
    dashboard/
    menu/
    orders/
    payments/
    customers/
    reports/
    vendors/
    expenses/
    settings/
  pages/
    admin/
    restaurant/
    customer/
  services/
    api/               # Axios client and endpoint functions
  stores/              # Zustand stores only
  hooks/
  lib/                 # formatters, permissions, constants, helpers
  styles/
```

### First installation set

```bash
npm create vite@latest chpl-food-frontend -- --template react-ts
cd chpl-food-frontend
npm install react-router-dom @tanstack/react-query axios zustand react-hook-form zod @hookform/resolvers lucide-react recharts date-fns sonner @tanstack/react-table
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-tabs @radix-ui/react-tooltip
npm install -D tailwindcss @tailwindcss/vite
```

## 12. CSS Architecture

Keep tokens and reusable primitives centralized. Do not scatter raw hex values through page components.

```text
src/styles/
  tokens.css          # colors, spacing, radii, shadows, z-index
  globals.css         # reset, body, typography, global helpers
  utilities.css       # small reusable utility classes (optional)
src/components/ui/
  Button/
  Input/
  GlassPanel/
  Badge/
  DataTable/
  Modal/
```

Rules:

- Use CSS variables/design tokens for every repeated color, shadow, radius, and spacing value.
- Prefer component-scoped CSS modules, Tailwind utility conventions, or a coherent CSS-in-JS approach—choose one primary approach and stay consistent.
- Avoid `!important` except in third-party component overrides.
- Define z-index layers centrally: base `0`, sticky `10`, dropdown `30`, modal `50`, toast `70`.

## 13. “Experienced Team” Finish Checklist

Before considering a page complete, verify:

- It has loading, empty, error, and populated states.
- It works with long restaurant/menu/customer names.
- It works on a 375px mobile width and a 1280px desktop width.
- All actions give immediate feedback and prevent duplicate submissions.
- Destructive actions have confirmation and clear consequences.
- Keyboard navigation and visible focus work.
- Numbers, currency, dates, and statuses align consistently.
- Text, color, spacing, and border styles come from shared tokens.
- There are no lorem ipsum strings, raw API errors, unexplained icons, or unfinished empty panels.

This visual system should be implemented first with the Week 1 login page, application shell, dashboard placeholders, profile page, and common UI components. Once those feel consistent, every later POS, admin, and customer screen should reuse the same foundations.
