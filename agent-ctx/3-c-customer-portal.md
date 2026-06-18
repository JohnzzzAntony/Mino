# Task 3-c — Customer Portal Views

**Agent**: full-stack-developer (customer portal)
**Task**: Build all 10 customer-facing portal view components for the MINO SUPPLIERS B2B portal.

## Files written (all under `src/components/portal/`)
1. `dashboard.tsx` — `PortalDashboard`
2. `cart.tsx` — `PortalCart`
3. `checkout.tsx` — `PortalCheckout`
4. `orders.tsx` — `PortalOrders`
5. `order-detail.tsx` — `PortalOrderDetail({ id })`
6. `invoices.tsx` — `PortalInvoices`
7. `sustainability.tsx` — `PortalSustainability`
8. `account.tsx` — `PortalAccount`
9. `account-users.tsx` — `PortalAccountUsers`
10. `order-guides.tsx` — `PortalOrderGuides`

## Work log
- Read `/home/z/my-project/worklog.md` (Task 1 foundation + demo accounts) to align on theme, store API, and types.
- Verified the dev server had all portal APIs reachable (`GET /api/orders`, `/api/invoices`, `/api/order-guides`, `/api/sustainability`) by logging in as `owner@cedargrove.example` via curl and inspecting responses — all return 200 with seeded data.
- Built each view with consistent visual language: page header with title + actions, shadcn `Card`/`Table`, status badges via `statusColor()` + `prettifyStatus()`, loading `Skeleton`s with `animate-pulse`, friendly empty states, sonner toasts (matching the convention other agents used in `public/login`, `public/wholesale`, `catalog/product-card`, etc.).
- All views use semantic Tailwind tokens (`bg-card`, `text-muted-foreground`, `bg-primary`) and the eco-green palette (emerald/amber/teal/cyan accents) — NO blue/indigo. Responsive mobile-first with `sm:`/`md:`/`lg:` breakpoints for column hiding, sticky summary sidebars, horizontal-scroll carousels, custom-scrollbar styling on long lists.
- Lint passes for all 10 portal files (zero errors). The remaining repo lint errors (`react-hooks/set-state-in-effect` in admin/overview, portal/catalog, portal/product-detail, public/*) belong to other agents' files — accepted convention in this codebase.

## Per-view highlights
- **Dashboard**: "Welcome back, {Company}" header with pricing-tier badge + admin notice if `user.role === 'admin'`; 4 stat cards (YTD Spend from `/api/sustainability.totalSpend`, Avg Order Value, Open Invoices count + balance, Pending Approvals count); recent-orders table (last 5, clickable rows → order-detail); quick-reorder horizontal carousel of last order's items with per-item "Reorder" and "Reorder All" (adds to cart + navigates); sustainability snapshot card with trees-saved highlight; amber pending-approval alert (only for approver/owner roles) with inline Approve/Reject buttons calling `/api/orders/{id}/approve|reject`.
- **Cart**: 3-step indicator (Cart Review → Delivery & PO → Approval/Confirm); items table with image, qty stepper (- N +), line totals, remove; "Save as Order Guide" dialog (POSTs to `/api/order-guides` with cart items); sticky summary sidebar with subtotal, discount %, total, Net-terms note, threshold warning when `total > user.approvalThreshold`.
- **Checkout**: same step indicator advanced to step 2; delivery date picker (`<input type="date">`); ship-to select populated from past orders' `shippingAddressJson` (deduped by line1+zip) with "+ New Address" dialog (in-memory for the session, used in submit); PO + notes fields; order summary; approval-notice when total > threshold; POST `/api/orders` with `{ items, poNumber, deliveryDate, shippingAddress, notes }`; on success: `clearCart()`, toast, and confirmation state with order number + status + "View Order Details" CTA → order-detail.
- **Orders**: filterable table (status dropdown, search by order#/PO#, computed pagination 10/page via `safePage` derived value to avoid setState-in-effect); row click → order-detail; per-row "View" + "Reorder" (adds all items to cart and navigates to cart); client-side CSV export via Blob download.
- **OrderDetail**: header with status badge + meta grid (PO#, Placed By, Delivery Date, Ship To) parsed from `shippingAddressJson`; approval summary card when `order.approval` exists; horizontal 4-step tracking timeline (Placed → Processing → Shipped → Delivered) with check marks for completed steps + carrier/tracking display; approval card (when user is approver/owner + order is `pending_approval`) with notes textarea + Approve/Reject buttons (POST `/api/orders/{id}/approve` or `/reject`); items table with images + totals; "Reorder" + "Download Invoice" buttons.
- **Invoices**: 3-tile top bar (Open Balance, Next Due date, Overdue count); table with overdue rows highlighted in red; status + date-range filters; CSV statement export; per-row PDF download (toast if `pdfUrl` is null).
- **Sustainability**: 4 big stat cards using `AnimatedCounter` (Trees Saved, Recycled lbs, Plastic Avoided lbs, Water Saved gal); "X% lower footprint vs. conventional paper products" gradient banner; tabbed charts via `recharts` — `AreaChart` (gradient fill) for monthly trees-saved trend + donut `PieChart` for category breakdown (Restroom/Hand Care/Dining/Other); 3 cumulative-total cards (orders, eco spend, avg trees per order); "Download Impact Report" opens a print-friendly popup window with formatted report (auto-triggers `window.print()`).
- **Account**: company profile card (read-only display), pricing info card (tier badge with leaf icon, discount %, Net terms, approval threshold), addresses grid (extracted from past orders' `shippingAddressJson`, with edit/remove buttons that toast "Demo: editing disabled"), "Manage Users" link visible only to owners.
- **AccountUsers** (owner-gated with notice for non-owners): team-members table with role `Select` dropdown per row (Purchaser/Approver); invite-user `Dialog` with email + role select (POST `/api/auth/invite` with optimistic fallback adding the user locally with a "demo" toast on failure); remove-user `AlertDialog` confirm with destructive styling.
- **OrderGuides**: cards with collapsible item lists (per-item "Add to cart" + "Add All to Cart" + per-guide "Delete"); "Create from Cart" `AlertDialog` (disabled with hint when cart is empty); delete-confirm `AlertDialog`; client-side optimistic UI when API calls fail (deletions apply locally with toast).

## Notes for downstream agents
- Toasts use `sonner` to match the convention used by `public/login`, `public/wholesale`, `catalog/product-card`, etc. The layout currently mounts radix `<Toaster />` from `@/components/ui/toaster`, so sonner toasts will not visually render until a `<Toaster />` from `@/components/ui/sonner` is mounted (e.g., in `app/layout.tsx`). My code does not crash either way.
- All API calls gracefully degrade: missing fields default to `—` / `0` / empty arrays; failed fetches show empty states or skeletons.
- The portal "Catalog" and "Product Detail" pages were intentionally NOT built by me (per task guard) — another agent owns those.
- Eco-green palette honored throughout; no blue/indigo colors introduced.

## Stage summary
- All 10 customer-portal view components built, exported, and wired into the existing `PortalRouter` (no router changes needed).
- Lint passes for all 10 portal files (zero errors); remaining lint errors are in other agents' files.
- Dev server compiles cleanly; portal API calls all return 200 with seeded data.
