# MINO SUPPLIERS — Website + B2B Portal
### Complete Build Specification & Wireframe
*"Eco-Friendly Hygiene Solutions. Soft. Sustainable. Responsible."*

This document is written so you can hand it directly to an AI coding agent (Claude Code, Cursor, etc.) and it has everything needed to scaffold and build the full site: stack, architecture, data model, every page's layout, user flows, and a ready-to-paste build prompt at the end.

---

## 1. Recommended Tech Stack

A Sysco-style B2B portal needs three things a typical "marketing site" doesn't: **multi-role accounts**, **custom pricing per customer**, and **non-card checkout (net terms/invoicing)**. The stack below is chosen because it's heavily represented in AI training data (meaning coding agents build it reliably), scales from a simple marketing site to a full portal without a rewrite, and keeps hosting costs low at launch.

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | **Next.js 14+ (App Router, TypeScript)** | One codebase for public site + portal; great SEO for marketing pages; huge AI-training coverage |
| Styling/UI | **Tailwind CSS + shadcn/ui** | Fast, consistent, easy for an AI agent to extend |
| Database | **PostgreSQL** (hosted on **Supabase** or **Neon**) | Relational data fits orders/pricing/invoices perfectly |
| ORM | **Prisma** | Type-safe schema, easy migrations |
| Auth | **Supabase Auth** (or NextAuth.js) | Built-in roles, row-level security, magic links/invite flow for multi-user accounts |
| File storage | **Supabase Storage** (or S3) | Product images, SDS/spec PDFs, invoices |
| Search/filtering | **Postgres full-text search** to start → **Meilisearch** if catalog grows | Avoids over-engineering at launch |
| Transactional email | **Resend** or **SendGrid** | Order confirmations, approval requests, invites |
| Blog/Resources content | **MDX in-repo** to start → **Sanity CMS** later | Lets marketing edit content without code once it matters |
| Analytics | **GA4 + Segment → Klaviyo** | Matches your spec exactly |
| Payments (optional, later) | **Stripe Invoicing** | For customers who *want* to pay by card instead of net terms |
| Hosting | **Vercel** (app) + **Supabase** (DB/storage/auth) | Zero-DevOps, scales automatically, generous free tier for MVP |

**Faster alternative (non-custom path):** If you'd rather launch in days instead of weeks and don't need a fully custom approval/pricing engine yet, **Shopify Plus + Shopify B2B** can cover catalog, accounts, and net-terms checkout out of the box, with a custom Next.js storefront on top later. The spec below assumes the custom path, since that's what lets an AI agent build *everything* end-to-end as you asked — but flag this alternative if speed-to-launch matters more than full customization.

---

## 2. System Architecture

```
                         ┌─────────────────────────┐
                         │        Visitors          │
                         └────────────┬─────────────┘
                                      │
                         ┌────────────▼─────────────┐
                         │   Next.js App (Vercel)    │
                         │  ┌───────────────────┐    │
                         │  │ Public Marketing   │    │  ← no login required
                         │  │ Routes (/, /products,   │
                         │  │ /about, /blog, /wholesale│
                         │  │ /contact)          │    │
                         │  └───────────────────┘    │
                         │  ┌───────────────────┐    │
                         │  │ Customer Portal     │   │  ← auth required (role-gated)
                         │  │ Routes (/portal/*)  │   │
                         │  └───────────────────┘    │
                         │  ┌───────────────────┐    │
                         │  │ Admin Routes        │   │  ← admin role only
                         │  │ (/admin/*)          │   │
                         │  └───────────────────┘    │
                         └────────────┬─────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              ▼                       ▼                       ▼
   ┌────────────────────┐  ┌──────────────────┐   ┌───────────────────────┐
   │ Supabase Postgres   │  │ Supabase Auth     │   │ Supabase Storage      │
   │ (orders, products,  │  │ (roles, sessions, │   │ (images, SDS sheets,  │
   │  pricing, invoices)  │  │  invites)         │   │  invoices)            │
   └────────────────────┘  └──────────────────┘   └───────────────────────┘
              │
   ┌──────────┴───────────────────────────────────────────────┐
   ▼                  ▼                  ▼                    ▼
QuickBooks/Xero    Shipping/Tracking   GA4 + Segment +     CRM (HubSpot/
(invoice sync)     (EasyPost/ShipStation) Klaviyo           Salesforce)
```

---

## 3. Information Architecture (Sitemap)

```
/                              Public homepage
/products                      Catalog (filterable)
/products/[category]           Category landing (Restroom Paper / Hand Drying / Dining Paper)
/products/[category]/[slug]    Product detail
/about                          Ojibwe story + YANUODO partnership + values
/wholesale                      Wholesale / Trade inquiry form (lead capture)
/blog                            Resources / blog index
/blog/[slug]                     Blog post
/contact                         Contact page
/privacy, /terms                 Legal
/login, /register                Auth (register = invite-only or "request access")

/portal                          Customer dashboard (post-login home)
/portal/catalog                  Customer-specific catalog (custom pricing applied)
/portal/order-guides              Saved lists / favorites / par stock lists
/portal/cart                     Cart → checkout
/portal/checkout                 PO #, delivery date, address, approval routing
/portal/orders                   Order history (filterable, exportable)
/portal/orders/[id]               Order detail + tracking
/portal/invoices                  Invoices & statements
/portal/sustainability            Impact dashboard (trees saved, plastic reduced, etc.)
/portal/account                   Company profile, addresses, users & roles
/portal/account/users              Manage purchasers/approvers (owner only)

/admin                            Admin overview (orders to approve, new leads)
/admin/leads                       Wholesale inquiries → approve into customers
/admin/customers                    Accounts, pricing tiers, terms
/admin/products                     Catalog management
/admin/orders                       All orders, approval queue, fulfillment status
/admin/invoices                     Invoice management
/admin/reports                      Analytics & exports
```

---

## 4. User Roles & Permissions

| Role | Scope | Can do |
|---|---|---|
| **Visitor** | Public site | Browse marketing pages, submit wholesale inquiry, sign up for newsletter |
| **Purchaser** | One company account | Browse catalog at company's pricing, build carts/order guides, submit orders (may require approval) |
| **Approver** | One company account | Everything a Purchaser can, plus approve/reject orders above a threshold |
| **Owner** | One company account | Everything above, plus manage company users, addresses, and view invoices/statements |
| **Admin (Mino staff)** | Everything | Approve new accounts, set pricing tiers, manage catalog, manage orders/invoices, view analytics |

Approval threshold (e.g., "orders over $500 require Approver sign-off") should be a configurable field per company, not hardcoded.

---

## 5. Database Schema

```prisma
model Company {
  id              String   @id @default(uuid())
  name            String
  status          String   // pending | approved | suspended
  pricingTierId   String?
  netTermsDays    Int      @default(30)
  approvalThreshold Decimal @default(500)
  createdAt       DateTime @default(now())

  users           User[]
  addresses       Address[]
  orders          Order[]
  invoices        Invoice[]
  priceOverrides  ProductPriceOverride[]
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  name         String
  role         String   // purchaser | approver | owner | admin
  companyId    String?
  company      Company? @relation(fields: [companyId], references: [id])
  createdAt    DateTime @default(now())
}

model Address {
  id         String  @id @default(uuid())
  companyId  String
  label      String
  line1      String
  line2      String?
  city       String
  state      String
  zip        String
  type       String  // billing | shipping
}

model PricingTier {
  id              String @id @default(uuid())
  name            String  // e.g. "Tier 1 - Volume"
  discountPercent Decimal
}

model Category {
  id        String @id @default(uuid())
  name      String  // Restroom Paper / Hand Drying Paper / Dining Paper
  slug      String  @unique
  parentId  String?
}

model Product {
  id            String   @id @default(uuid())
  sku           String   @unique
  name          String
  slug          String   @unique
  categoryId    String
  description   String
  specs         Json     // ply count, size, sheet count, dimensions...
  certifications String[] // e.g. Green Seal, FSC, EPA Safer Choice
  application   String[]  // household | commercial | hotel
  unit          String    // case, roll, each
  casePackSize  Int
  basePrice     Decimal
  images        String[]
  sustainabilityMetrics Json  // e.g. { recycledContent: "80%", treesSavedPerCase: 0.4 }
  sdsUrl        String?
  techSheetUrl  String?
  status        String    // active | discontinued
}

model ProductPriceOverride {
  id         String  @id @default(uuid())
  companyId  String
  productId  String
  price      Decimal
}

model OrderGuide {
  id         String  @id @default(uuid())
  companyId  String
  userId     String
  name       String  // "Weekly Par Stock", "Favorites"
  items      Json    // [{ productId, quantity }]
}

model Order {
  id            String   @id @default(uuid())
  companyId     String
  userId        String
  poNumber      String?
  status        String   // draft | pending_approval | approved | submitted | processing | shipped | delivered | invoiced
  deliveryDate  DateTime?
  shippingAddressId String
  subtotal      Decimal
  total         Decimal
  sustainabilitySummary Json   // computed at order time
  createdAt     DateTime @default(now())

  items         OrderItem[]
  approval      ApprovalRequest?
}

model OrderItem {
  id         String  @id @default(uuid())
  orderId    String
  productId  String
  quantity   Int
  unitPrice  Decimal
}

model ApprovalRequest {
  id          String  @id @default(uuid())
  orderId     String  @unique
  requestedBy String
  approverId  String?
  status      String  // pending | approved | rejected
  notes       String?
}

model Invoice {
  id            String  @id @default(uuid())
  companyId     String
  orderId       String
  invoiceNumber String  @unique
  amount        Decimal
  dueDate       DateTime
  status        String  // open | paid | overdue
  pdfUrl        String?
}

model WholesaleLead {
  id           String  @id @default(uuid())
  companyName  String
  contactName  String
  email        String
  phone        String?
  volumeNeeds  String?
  message      String?
  status       String   // new | contacted | approved | rejected
  createdAt    DateTime @default(now())
}

model BlogPost {
  id          String   @id @default(uuid())
  title       String
  slug        String   @unique
  content     String
  author      String
  tags        String[]
  publishedAt DateTime?
}
```

---

## 6. Page-by-Page Wireframes

### 6.1 Public Homepage (`/`)

```
┌──────────────────────────────────────────────────────────────────┐
│ [MINO LOGO]   Products ▾   About   Blog   Contact   [Login] [Become a Customer] │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│              ▓▓▓ HERO — eco-poster background image ▓▓▓           │
│        "Eco-Friendly Hygiene Solutions."                          │
│        "Soft. Sustainable. Responsible."                          │
│        [ Become a Customer ]     [ Browse Products ]              │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│  Why Mino?  (4 icon callouts)                                     │
│  🌱 Sustainably sourced   📦 Bulk-ready   🤝 B2B pricing   🪶 Ojibwe roots │
├──────────────────────────────────────────────────────────────────┤
│  Shop by Category                                                 │
│  [ Restroom Paper ]   [ Hand Drying Paper ]   [ Dining Paper ]     │
│  (each card → category landing page)                              │
├──────────────────────────────────────────────────────────────────┤
│  The Mino Story                                                   │
│  short narrative: Ojibwe meaning of "Mino" (the good way) +       │
│  YANUODO manufacturing partnership + values   [ Read more → ]     │
├──────────────────────────────────────────────────────────────────┤
│  Sustainability impact strip (animated counters)                  │
│  "X trees saved"   "X lbs plastic reduced"   "X% recycled content"│
├──────────────────────────────────────────────────────────────────┤
│  Trusted by / testimonials (logos or quotes, generic placeholders)│
├──────────────────────────────────────────────────────────────────┤
│  CTA band: "Ready to stock smarter?"  [ Request Wholesale Access ]│
├──────────────────────────────────────────────────────────────────┤
│  Footer: newsletter signup | product links | company links |      │
│  social icons | © Mino Suppliers | Privacy | Terms                │
└──────────────────────────────────────────────────────────────────┘
```

### 6.2 Product Catalog (`/products`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Header (same nav)                                                │
├───────────────┬──────────────────────────────────────────────────┤
│ FILTERS        │  Sort: [Best Sellers ▾]      Showing 1–24 of 86   │
│ Category        │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│ ☐ Restroom Paper │  │ image  │ │ image  │ │ image  │ │ image  │    │
│ ☐ Hand Drying    │  │ name   │ │ name   │ │ name   │ │ name   │    │
│ ☐ Dining Paper   │  │ specs  │ │ specs  │ │ specs  │ │ specs  │    │
│                  │  │ $price │ │ $price │ │ $price │ │ $price │    │
│ Ply Count        │  │[Details]│ │[Details]│ │[Details]│ │[Details]│  │
│ ☐ 1-ply  ☐ 2-ply │  └────────┘ └────────┘ └────────┘ └────────┘    │
│                  │  (grid continues, pagination at bottom)         │
│ Application      │                                                 │
│ ☐ Household       │                                                │
│ ☐ Commercial       │                                                │
│ ☐ Hotel            │                                                │
│                    │                                                │
│ Certifications     │                                                │
│ ☐ Green Seal        │                                                │
│ ☐ FSC                │                                                │
└───────────────┴──────────────────────────────────────────────────┘
```
*Note: when a logged-in customer views this page, prices shown reflect their `ProductPriceOverride` or `PricingTier` discount, and an "Add to Order Guide" button replaces the generic "Details" CTA.*

### 6.3 Product Detail (`/products/[category]/[slug]`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Breadcrumb: Products / Restroom Paper / Jumbo Bath Tissue 2-Ply  │
├───────────────────────────┬──────────────────────────────────────┤
│  [ image gallery ]          │  Jumbo Bath Tissue (2-Ply)           │
│                              │  SKU: 10234     ★★★★☆ (internal)    │
│                              │  $XX.XX / case (24 rolls)            │
│                              │  Qty: [ - 1 + ]   [ Add to Cart ]    │
│                              │  (logged in: shows your price)       │
│                              │  Certifications: 🌿 Green Seal  ♻ 80%│
│                              │  recycled                            │
├───────────────────────────┴──────────────────────────────────────┤
│  Tabs: [ Specifications ] [ Sustainability ] [ Downloads ]         │
│  Specs table: ply, sheet size, sheets/roll, rolls/case, dims...    │
│  Sustainability: recycled content %, trees-saved-per-case          │
│  Downloads: [ SDS Sheet.pdf ]  [ Tech Spec Sheet.pdf ]              │
├──────────────────────────────────────────────────────────────────┤
│  Related products carousel                                         │
└──────────────────────────────────────────────────────────────────┘
```

### 6.4 Wholesale / Trade Inquiry (`/wholesale`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Headline: "Partner with Mino Suppliers"                          │
│  Subtext: net-terms, custom pricing, dedicated support             │
├──────────────────────────────────────────────────────────────────┤
│  Form:                                                             │
│   Company Name *        [______________________]                  │
│   Contact Name *         [______________________]                  │
│   Email *                 [______________________]                  │
│   Phone                    [______________________]                  │
│   Business Type ▾          (Hotel / Restaurant / Janitorial / Other)│
│   Estimated Monthly Volume ▾                                       │
│   Message / Needs           [ textarea ]                            │
│   [ Submit Inquiry ]                                               │
├──────────────────────────────────────────────────────────────────┤
│  Sidebar: "What happens next" 3-step timeline                      │
│  1. We review your inquiry (1–2 business days)                     │
│  2. We set up your account + custom pricing                        │
│  3. You get portal access + your first order                       │
└──────────────────────────────────────────────────────────────────┘
```
Submitting this form creates a `WholesaleLead` row and notifies admin (email + `/admin/leads`).

### 6.5 Login / Register

```
┌───────────────────────────┐
│        MINO LOGO            │
│   Email   [____________]    │
│   Password[____________]    │
│   [ Log In ]                 │
│   Forgot password?           │
│   ────────────────           │
│   New to Mino? → /wholesale  │
│   (no public self-register;  │
│    accounts are invite-only  │
│    after admin approval)     │
└───────────────────────────┘
```

### 6.6 Customer Dashboard (`/portal`) — post-login home

```
┌──────────────────────────────────────────────────────────────────┐
│ Portal Nav: Dashboard | Catalog | Order Guides | Orders | Invoices │
│             | Sustainability | Account            [Cart] [User ▾]  │
├──────────────────────────────────────────────────────────────────┤
│  Welcome back, [Company Name]                                      │
├───────────────┬───────────────┬───────────────┬────────────────────┤
│ YTD Spend      │ Avg Order Val │ Open Invoices  │ Pending Approvals  │
│ $XX,XXX        │ $XXX          │ 2 ($X,XXX)     │ 1 order            │
├───────────────┴───────────────┴───────────────┴────────────────────┤
│  Recent Orders                                                      │
│  #1023  Jun 12  $452.00  Delivered     [View]                       │
│  #1019  Jun 03  $1,204.50 Processing   [View]                       │
│  [ View All Orders → ]                                              │
├──────────────────────────────────────────────────────────────────┤
│  Quick Reorder (your favorites / last order)                        │
│  [ product card ] [ product card ] [ product card ]  [ Reorder All ]│
├──────────────────────────────────────────────────────────────────┤
│  Sustainability Snapshot:  "You've saved ~14 trees this year"  [→]  │
└──────────────────────────────────────────────────────────────────┘
```

### 6.7 Cart → Checkout (`/portal/checkout`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Step 1: Cart Review  →  Step 2: Delivery & PO  →  Step 3: Approval/Confirm │
├──────────────────────────────────────────────────────────────────┤
│  Cart Items (editable qty, remove)             Order Summary       │
│  Jumbo Bath Tissue x10 case   $XXX               Subtotal  $XXX    │
│  Multifold Towels  x5 case    $XXX               Your discount -$X │
│  [ Save as Order Guide ]                         Total     $XXX    │
├──────────────────────────────────────────────────────────────────┤
│  Delivery Date: [ date picker ]                                    │
│  Ship to: [ saved address dropdown ▾ ]  [+ New Address]            │
│  PO Number: [______________]                                       │
│  Notes: [ textarea ]                                                │
├──────────────────────────────────────────────────────────────────┤
│  ⚠ This order exceeds your $500 approval threshold and will be      │
│     routed to [Approver Name] before it's submitted.                │
│  [ Submit Order ]                                                   │
└──────────────────────────────────────────────────────────────────┘
```
No payment field here — order is submitted on **net terms**; an invoice is generated on the company's billing cycle. (If you later want optional card payment, add a Stripe Invoicing "Pay Now" button on the invoice page only.)

### 6.8 Order History / Detail (`/portal/orders`, `/portal/orders/[id]`)

```
List view: filterable table — Order #, Date, PO#, Status, Total, [View] [Reorder]
Export: [ Export CSV ]

Detail view:
┌──────────────────────────────────────────────────────────────────┐
│  Order #1023 — Delivered Jun 14                                    │
│  PO# 88213   Placed by: J. Smith   Approved by: M. Lee             │
├──────────────────────────────────────────────────────────────────┤
│  Items table (product, qty, unit price, line total)                │
├──────────────────────────────────────────────────────────────────┤
│  Tracking: ●──●──●──○  Placed → Processing → Shipped → Delivered   │
│  Carrier: XYZ Freight   Tracking#: 123456789                       │
├──────────────────────────────────────────────────────────────────┤
│  [ Download Invoice ]   [ Reorder ]                                 │
└──────────────────────────────────────────────────────────────────┘
```

### 6.9 Invoices & Statements (`/portal/invoices`)

```
Table: Invoice #, Order #, Issue Date, Due Date, Amount, Status (Open/Paid/Overdue), [Download PDF]
Top bar: Total Open Balance: $X,XXX   Next Due: Jun 30
Filter by date range, export statement (CSV/PDF) for accounting.
```

### 6.10 Sustainability Impact (`/portal/sustainability`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Your Impact This Year                                             │
│  🌳 14 trees saved   ♻ 320 lbs recycled content purchased          │
│  📉 8% lower footprint vs. conventional paper products             │
│  [ Chart: monthly sustainable purchases over time ]                 │
│  [ Download Impact Report PDF — share with your stakeholders ]      │
└──────────────────────────────────────────────────────────────────┘
```

### 6.11 Account / Users (`/portal/account`, `/portal/account/users`)

```
Account: Company profile, billing address, shipping addresses (add/edit/remove), net terms shown (read-only).
Users (Owner only): table of company users (name, email, role), [ Invite User ] → sends invite email,
role dropdown per user (Purchaser / Approver), [ Remove ].
```

### 6.12 Admin — Leads & Customers (`/admin/leads`, `/admin/customers`)

```
Leads queue: New inquiries → [ Approve → creates Company + invite email ] or [ Reject ]
Customers: list with status, pricing tier, net terms; click in to:
  - set/override pricing tier
  - set approval threshold
  - view their order history
  - suspend account
```

### 6.13 Admin — Orders / Reports (`/admin/orders`, `/admin/reports`)

```
Orders: all orders across customers, filter by status, bulk-update fulfillment status, generate invoice on "delivered".
Reports: repeat order rate, AOV by customer type, top products, cart abandonment, sustainability content engagement
(pulled from GA4/Segment), exportable CSV.
```

---

## 7. Core User Flows

**A. Lead → Approved Customer**
Visitor fills `/wholesale` form → `WholesaleLead` created + admin notified → Admin reviews, approves → system creates `Company` + first `User` (role: owner) → invite email sent → user sets password → lands on `/portal`.

**B. Ordering**
Browse `/portal/catalog` (pricing reflects tier/overrides) → add to cart or order guide → `/portal/checkout` (PO#, delivery date, address) → if `total > approvalThreshold`, status becomes `pending_approval` and an `ApprovalRequest` is created + approver notified → approver approves → status `submitted` → admin fulfills → status updates through `processing → shipped → delivered` → `Invoice` auto-generated on delivery with due date = `deliveredDate + netTermsDays`.

**C. Reorder**
`/portal/orders` → "Reorder" on a past order → pre-filled cart at *current* pricing → user adjusts quantities → continues at checkout.

---

## 8. Integrations Checklist

| Integration | Purpose | Suggested tool |
|---|---|---|
| Accounting | Sync invoices/payments | QuickBooks Online API or Xero API |
| Shipping/tracking | Carrier tracking on order detail | EasyPost or ShipStation |
| CRM | Sync wholesale leads | HubSpot (has a generous free tier) |
| Analytics | Funnel + behavior tracking | GA4 (enhanced ecommerce) + Hotjar |
| CDP/Marketing | Lifecycle email, segmentation | Segment → Klaviyo |
| Transactional email | Order confirmations, invites, approvals | Resend or SendGrid |

---

## 9. Security & Compliance Checklist

- [ ] SSL via Vercel (automatic)
- [ ] Role-based access enforced both in middleware *and* Postgres Row-Level Security (defense in depth)
- [ ] Audit log table for pricing changes, order approvals, account status changes
- [ ] Cookie consent banner + privacy policy for GDPR/CCPA
- [ ] Rate limiting on auth and form endpoints
- [ ] PII (addresses, contact info) encrypted at rest (Supabase default) and never logged
- [ ] Invoices/SDS PDFs stored in private storage bucket with signed URLs, not public

---

## 10. Build Roadmap

| Phase | Scope | Rough effort |
|---|---|---|
| **1 — Marketing MVP** | Homepage, catalog (static pricing), product detail, about, wholesale form, blog, contact, SEO + GA4 | 1–2 weeks |
| **2 — Portal Core** | Auth + roles, dashboard, cart/checkout (no approval routing yet), order history | 2–3 weeks |
| **3 — B2B Depth** | Custom pricing tiers/overrides, approval workflows, invoices/statements, sustainability dashboard | 2–3 weeks |
| **4 — Integrations & Admin Polish** | QuickBooks/CRM/shipping integrations, admin reports, loyalty | 2+ weeks |

Build and ship Phase 1 first — it gets you a live, lead-generating site fast while Phase 2–4 are built behind it.

---

## 11. Suggested Repo Structure

```
mino-suppliers/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                 # homepage
│   │   ├── products/...
│   │   ├── about/page.tsx
│   │   ├── wholesale/page.tsx
│   │   ├── blog/...
│   │   └── contact/page.tsx
│   ├── (portal)/
│   │   ├── portal/page.tsx          # dashboard
│   │   ├── portal/catalog/...
│   │   ├── portal/checkout/...
│   │   ├── portal/orders/...
│   │   ├── portal/invoices/...
│   │   └── portal/account/...
│   ├── (admin)/admin/...
│   └── api/...                      # route handlers (webhooks, server actions)
├── components/
│   ├── ui/                          # shadcn components
│   ├── catalog/
│   ├── checkout/
│   └── dashboard/
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── pricing.ts                   # tier/override resolution logic
├── prisma/schema.prisma
└── middleware.ts                    # role-based route gating
```

---

## 12. Master Prompt — Paste This to an AI Coding Agent

```
Build a Next.js 14 (App Router, TypeScript) website for "MINO SUPPLIERS," a B2B
eco-friendly hygiene/paper products supplier. Tagline: "Eco-Friendly Hygiene
Solutions. Soft. Sustainable. Responsible."

Stack: Tailwind CSS + shadcn/ui, Prisma + PostgreSQL (Supabase), Supabase Auth
with roles (purchaser, approver, owner, admin), Supabase Storage for product
images/SDS PDFs, Resend for transactional email.

Build in this order:
1. Public marketing site: homepage (hero, category cards, brand story, sustainability
   stats, CTA), product catalog with filters (category, ply count, application,
   certifications), product detail pages, About page, a Wholesale Inquiry form that
   writes to a WholesaleLead table and emails admin, a Blog (MDX) section, Contact page.
2. Auth: invite-only registration. Admin approves WholesaleLeads, which creates a
   Company + first User (role: owner) and sends an invite email.
3. Customer portal at /portal: dashboard (YTD spend, recent orders, quick reorder,
   open invoices), catalog with per-company pricing (PricingTier + per-product
   overrides), cart, checkout (PO number, delivery date, shipping address — NO
   credit card, net-terms only), order history with tracking status, invoices &
   statements, a sustainability impact page, and account/user management for Owners.
4. Approval workflow: if an order total exceeds the company's approvalThreshold,
   set status to pending_approval and notify the company's Approver; only after
   approval does it move to submitted.
5. Admin panel at /admin: leads queue, customer management (pricing tier, terms,
   threshold), product management, order management/fulfillment status updates,
   and basic reports.

Use the database schema, sitemap, and page wireframes in the attached spec exactly.
Start with Phase 1 (public marketing site) as a fully working, deployable slice
before building the portal.
```

---

### Notes / Assumptions Made
- Checkout has **no card payment field** by default since you specified net terms/invoice-on-account as the primary B2B pattern — Stripe Invoicing is only suggested as an optional "Pay Now" add-on later, not a launch requirement.
- Registration is **invite-only** (admin approves leads → creates account) rather than open self-signup, matching the "approved buyers" model you described.
- Blog/CMS starts as in-repo MDX to avoid extra cost/complexity at launch; swap in Sanity later if non-technical staff need to publish often.
