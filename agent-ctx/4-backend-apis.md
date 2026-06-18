# Task 4 — Backend APIs (full-stack-developer)

## Scope
Built all required `/api/*` route handlers for the MINO SUPPLIERS B2B portal:
- leads, orders, orders/[id], orders/[id]/approve, orders/[id]/reject
- invoices, order-guides, order-guides/[id], sustainability
- admin/leads, admin/leads/[id]
- admin/customers, admin/customers/[id]
- admin/products, admin/products/[id]
- admin/orders, admin/orders/[id]
- admin/invoices, admin/invoices/[id]
- admin/reports

## Important fix (schema)
The provided `prisma/schema.prisma` was missing several relations that the existing
`src/lib/serialize.ts` and `src/lib/session.ts` already depended on:
- `Company.pricingTier PricingTier?` (relation to PricingTier)
- `PricingTier.companies Company[]` (back-relation)
- `Order.user User` (relation to placing user)
- `ApprovalRequest.requestedByUser User` and `approverUser User?` (named relations)
- `OrderGuide.user User` (relation to creator)
- `User.ordersPlaced`, `User.approvalsRequested`, `User.approvalsResolved`, `User.orderGuides` (back-relations)

Without these, `getSession()` and every authenticated endpoint would throw
`Unknown field pricingTier for include statement on model Company`. Schema was
updated and `bun run db:push` re-run to regenerate the Prisma client.

## Files created
- src/app/api/orders/route.ts (GET, POST)
- src/app/api/orders/[id]/route.ts (GET, PATCH)
- src/app/api/orders/[id]/approve/route.ts (POST)
- src/app/api/orders/[id]/reject/route.ts (POST)
- src/app/api/invoices/route.ts (GET)
- src/app/api/order-guides/route.ts (GET, POST)
- src/app/api/order-guides/[id]/route.ts (DELETE)
- src/app/api/sustainability/route.ts (GET)
- src/app/api/admin/leads/route.ts (GET)
- src/app/api/admin/leads/[id]/route.ts (PATCH)
- src/app/api/admin/customers/route.ts (GET)
- src/app/api/admin/customers/[id]/route.ts (GET, PATCH)
- src/app/api/admin/products/route.ts (GET, POST)
- src/app/api/admin/products/[id]/route.ts (PATCH, DELETE)
- src/app/api/admin/orders/route.ts (GET)
- src/app/api/admin/orders/[id]/route.ts (GET, PATCH)
- src/app/api/admin/invoices/route.ts (GET)
- src/app/api/admin/invoices/[id]/route.ts (PATCH)
- src/app/api/admin/reports/route.ts (GET)

## Files modified
- prisma/schema.prisma — added missing relations (see above)

## Files NOT modified (per instructions)
- src/lib/serialize.ts, src/lib/session.ts, src/lib/pricing.ts, src/lib/db.ts

## Notes for frontend agents
- POST /api/leads already existed (built by another agent) with stricter validation:
  businessType must be one of `['Hotel','Restaurant','Janitorial','Other']` (capitalized!)
  and monthlyVolume must be `['Small','Medium','Large']` (capitalized!). The seed data
  uses lowercase (`'restaurant'`, `'small'`) so admin lead display may want to title-case.
- All authed endpoints require a `mino-session` cookie (set by POST /api/auth/login).
- 403 returned (not 401) when role check fails; 401 only when no session.
- Order creation auto-generates `poNumber` as `PO-<timestamp>` if not provided.
- Setting an order status to `delivered` or `invoiced` auto-creates an Invoice
  (due = now + company.netTermsDays, invoiceNumber = `INV-<4digits>`).
- Sustainability endpoint only counts orders with status `delivered` or `invoiced`.
- `/api/admin/reports` returns everything in one response — front-end can render
  the dashboard with a single fetch.
- `/api/admin/customers` returns `ordersCount` and `usersCount` per company.
- `/api/admin/customers/[id]` returns full nested data: users, addresses, last 10 orders.
- Order guides store items as JSON; the POST endpoint enriches items with
  productName/sku/unitPrice using the company's resolved pricing.

## Testing performed
Logged in as admin@mino.supplies and purchaser@cedargrove.example; verified:
- All GET endpoints return data with proper serialization (parsed JSON fields).
- Order creation: small order goes to `submitted`, large order (>approvalThreshold)
  goes to `pending_approval` and creates an ApprovalRequest with the first
  approver/owner in the company as `approverId`.
- Approve / reject flows flip both the approval status and the order status.
- Admin PATCH order → delivered auto-creates invoice (verified invoice attached).
- Admin product CRUD: create, patch (price/bestSeller), soft-delete (status=discontinued).
- Admin customer PATCH updates threshold/netTerms.
- Admin lead approve creates Company + owner User (returns companyId, userId).
- Admin invoice PATCH marks paid + sets paidAt.
- `/api/sustainability` returns 12-month buckets with treesSaved + spend.

## Lint
`bun run lint` passes for all my new files. The only lint error is in
`src/components/admin/overview.tsx` (frontend code, not mine).
