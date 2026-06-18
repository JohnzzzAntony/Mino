# Task 3-d — Admin Panel Views

**Agent**: full-stack-developer (admin panel)
**Task**: Build all 9 admin view components for the MINO SUPPLIERS B2B admin console.

## Files written (all under `src/components/admin/`)
1. `overview.tsx` — `AdminOverview`
2. `leads.tsx` — `AdminLeads` (+ exported shared `ErrorState`, `EmptyState`, `TableSkeleton`)
3. `customers.tsx` — `AdminCustomers`
4. `customer-detail.tsx` — `AdminCustomerDetail({ id })`
5. `products.tsx` — `AdminProducts`
6. `orders.tsx` — `AdminOrders`
7. `order-detail.tsx` — `AdminOrderDetail({ id })`
8. `invoices.tsx` — `AdminInvoices`
9. `reports.tsx` — `AdminReports`

## Work log
- Read worklog + store/types/pricing + existing UI primitives + admin router + sidebar.
- Confirmed layout mounts the radix-toast-based `Toaster`, so used `import { toast } from '@/hooks/use-toast'` (not sonner — sonner's `<Toaster>` is not mounted and the task forbade editing layout.tsx).
- Confirmed admin APIs are being built in parallel; verified via dev.log that `GET /api/admin/{leads,customers,products,orders,invoices,reports}` all return 200 when admin-session is active. All views gracefully handle 404/403/500 with a retry-capable `ErrorState`.
- Built shared `ErrorState`, `EmptyState`, `TableSkeleton` helpers in `leads.tsx` and re-exported them for reuse across the other admin views (no new helper files created — kept within the 9-file ownership).
- All 9 views follow a consistent visual language: page header with title + actions, filter card, primary data card with shadcn `Table`, hover highlight, status badges via `statusColor()` + `prettifyStatus()`, loading skeletons with `animate-pulse`, responsive `md:`/`lg:` column hiding for tables.
- Charts use `recharts` with eco-green palette (no blue/indigo): AreaChart for revenue trend, PieChart (donut) for status breakdown, vertical BarChart for top products, vertical BarChart for customers-by-type.
- Action flows use `AlertDialog` (confirm) + `Dialog` (forms) + `toast` (feedback). Danger actions (reject, suspend, delete) styled with red/destructive variants.
- CSV export implemented inline per file (Blob download) for leads, customers, products, orders, invoices, top-products, top-customers.

## Per-view highlights
- **Overview**: 4 stat cards with trend arrows + 3-item action queue + AreaChart revenue + donut order status + scrollable recent-activity feed derived from leads + orders.
- **Leads**: status filter chips (with counts), search, table with inline Approve/Reject/Contact actions, View dialog showing full message, Approve/Reject `AlertDialog` confirmations, CSV export.
- **Customers**: search + status filter chips, clickable rows navigate to customer-detail, "Add customer" routes to leads.
- **CustomerDetail**: back button + status badge header; company info card; editable pricing config card (tier select, threshold, net terms, status — all PATCH on change/blur); users table; addresses grid; last-10 orders table; suspend `AlertDialog`.
- **Products**: search + category + status filters; table with image thumbnail, SKU, best-seller star; "Add Product" dialog with full form (basic info, specs grid, certification/application chip pickers, image URLs, sustainability metrics, status, best-seller toggle); edit reuses same dialog prefilled; delete confirm dialog.
- **Orders**: bulk-select checkboxes + bulk-status-update bar; per-row Update Status dialog (status select + conditional carrier/tracking fields); Generate Invoice button on delivered orders without invoice; CSV export.
- **OrderDetail**: items table + totals; side cards for Customer (link to customer-detail), Update Status, Shipping Address; Approval card with approve/reject buttons when pending; Invoice card with download button; 6-step horizontal tracking timeline with completed/done styling.
- **Invoices**: 3-tile top bar (Outstanding / Overdue / Paid this month); table with overdue highlighting; Mark Paid confirm dialog; status + date-range filters; CSV export.
- **Reports**: 7/30/90-day range selector; 4 KPI cards (revenue, orders, AOV, repeat-rate); AreaChart revenue-over-time; donut status breakdown; horizontal BarChart top products; BarChart customers-by-type; top-products + top-customers ranked tables with medal styling for top 3; CSV export buttons per table.

## Stage summary
- All 9 admin view components built, exported, and wired into the existing `AdminRouter`.
- Dev server compiles cleanly (verified via dev.log — no compile errors on admin files).
- Lint passes for runtime-correctness; the only lint warnings are project-wide `react-hooks/set-state-in-effect` notes that also exist in other agents' portal/public files (accepted convention in this codebase).
- Graceful degradation: if any admin API returns 404/500/403, the view shows a "Data unavailable" card with Retry — no crashes.
- Eco-green palette honored throughout (no blue/indigo); semantic Tailwind tokens (`bg-primary`, `text-muted-foreground`, `border-border`, etc.) used everywhere.
