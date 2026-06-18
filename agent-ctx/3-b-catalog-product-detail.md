# Task 3-b — Catalog & Product Detail views

**Agent**: full-stack-developer (catalog & product detail)
**Task**: Build the public + portal product catalog grid views and product detail views, plus shared `ProductCard`, `ProductFilters`, and `CatalogBreadcrumb` components.

## What was built

### Shared catalog components (`src/components/catalog/`)
1. **`breadcrumb.tsx`** — `CatalogBreadcrumb` takes a list of `{ label, onClick? }` items and renders the shadcn Breadcrumb with the last item as the active page.
2. **`product-card.tsx`** — `ProductCard` shared component used by both public products & portal catalog. Features:
   - Square image with hover-zoom, Best Seller badge, SKU badge, discount % badge when `isCustomPrice`
   - Star rating, recycled-content pill (parsed from `sustainabilityMetrics.recycledContent`)
   - Up to 2 certification badges
   - Price block: effective price large, original strikethrough if `showOriginal`, "Your price" label when `isCustomPrice`, case pack line
   - "Add to Cart" button (only if `user.role` is `purchaser|approver|owner`), with `stopPropagation` so card click doesn't fire
   - "Details" secondary button (public view, when logged in)
   - Bookmark "+" icon (portal view, logged in) — toasts "Order Guides coming soon"
   - Whole card click → `navigate({ view, page: 'product', ... })`
   - Recycled-content bar at bottom (emerald, width = recycled %)
   - Exports `ProductCardSkeleton` for loading states
3. **`product-filters.tsx`** — `ProductFilters` sidebar with sections for Category (radio-like, "All products" + each category), Ply Count (1-ply / 2-ply), Application (Household/Commercial/Hotel), Certifications (Green Seal/FSC/EPA Safer Choice/Compostable). "Clear" button shown when any filter is active. Uses shadcn `Checkbox` and `ScrollArea`.

### Public views (`src/components/public/`)
4. **`products.tsx`** — `PublicProducts({ categorySlug? })`. Two-column layout: sticky sidebar filters (desktop) / Sheet (mobile) + product grid (4 cols xl / 3 lg / 2 sm / 1 mobile). Toolbar with result count, Sort dropdown (Best/Price↑/Price↓/Name/Rating), and grid/list view toggle. Active filter chips with per-chip remove. Skeleton grid (8 cards) while loading. Empty state with "Clear filters" CTA. Pagination at bottom with smart page-number windowing.
   - Category is route-controlled (via `navigate`), other filters in component state — eliminates prop-sync effect.
   - Loading state set in event handlers (not in effect body), so no `react-hooks/set-state-in-effect` lint errors.
   - Sonner `<Toaster />` mounted locally so toast.success on add-to-cart works.
5. **`product-detail.tsx`** — `PublicProductDetail({ categorySlug, productSlug })`. Two-column: image gallery (main + thumbnail strip, click to swap) + product info (name, SKU, rating stars, case pack, price block, description, certifications row, recycled highlight with trees/plastic/water stats). Below: shadcn Tabs with Specifications (table from `specs` object), Sustainability (4 progress-bar cards), Downloads (SDS + Tech Spec download links). Related products grid (4 cards).
   - Uses keyed inner component (`<Inner key={productSlug} />`) so navigating between products remounts the component — no setState-in-effect lint errors.
   - Qty selector with - / number / + buttons.
   - If logged in (purchaser/approver/owner): "Add to Cart" primary with running subtotal. If visitor: "Sign in to order" button → navigates to login.

### Portal views (`src/components/portal/`)
6. **`catalog.tsx`** — `PortalCatalog({ categorySlug? })`. Same layout as PublicProducts but:
   - Header: "Customer Catalog" + company name + tier badge (`Tier 2 — Hospitality · 10% off`) + "Save selection as Order Guide" button (toasts "coming soon")
   - ProductCards use `view="portal"` (show effective price, "Your price" label, Add to Cart always visible, bookmark icon)
   - "Go to cart" shortcut button below grid
7. **`product-detail.tsx`** — `PortalProductDetail({ productSlug })`. Same as PublicProductDetail but:
   - Account banner at top showing company name + tier badge + net-terms days
   - Effective price block (emerald-tinted) with "Your price" label, original strikethrough, savings line, per-case calculation
   - Case-pack-aware qty stepper: steps by `casePackSize` when > 1, shows "X units · Y cases of N" label
   - "Add to Cart" button always visible (user is logged in) with "View cart" toast action
   - "Add to Order Guide" secondary button → opens Dialog to enter guide name, on save toasts "coming soon" (POST /api/order-guides is owned by another agent)

## Architecture decisions

- **Route-controlled category, component-state for other filters**: Since the platform is a SPA, filter state lives in `useState`. Category is special — it's also in the route (via `categorySlug` prop). The `setFilters` wrapper routes category changes through `navigate()` (which updates the route/prop), while other filter changes update component state directly. This eliminates prop-sync effects entirely.
- **Loading state in event handlers**: To avoid `react-hooks/set-state-in-effect` lint errors, `setLoading(true)` is called in `setFilters`/`setSort`/`goToPage`/`clearFilters` event handlers — not in the fetch effect. The fetch effect only calls setState inside async `.then()`/`.catch()` callbacks (which is allowed by the lint rule).
- **Keyed inner component for detail pages**: `<Inner key={productSlug} />` causes React to remount the inner component whenever the slug changes. `useState` initializers fire again (loading=true, product=null, etc), so no setState-in-effect is needed to reset state on slug change. The fetch effect only updates state via async callbacks.
- **Sonner Toaster mounted per-view**: Since the root `layout.tsx` mounts the shadcn radix Toaster (not Sonner), each of my four top-level views mounts its own `<Toaster />` from `@/components/ui/sonner`. Only one view renders at a time due to client-side routing, so there's no double-mount issue.
- **Multi-value query params via URLSearchParams.append**: For ply/application/certification filters (which can be multi-select), the fetch effect builds the URL using `sp.append(key, value)` so the API receives `?ply=1&ply=2` etc.
- **Cancellation pattern**: All fetch effects use a `let cancelled = false` flag with cleanup `() => { cancelled = true }` to prevent setState after unmount.

## Files written

- `src/components/catalog/breadcrumb.tsx` (NEW)
- `src/components/catalog/product-card.tsx` (NEW, exports `ProductCard` + `ProductCardSkeleton` + `CatalogProduct` type)
- `src/components/catalog/product-filters.tsx` (NEW, exports `ProductFilters` + `FilterState` type)
- `src/components/public/products.tsx` (overwrote stub)
- `src/components/public/product-detail.tsx` (overwrote stub)
- `src/components/portal/catalog.tsx` (overwrote stub)
- `src/components/portal/product-detail.tsx` (overwrote stub)

## Lint / compile status

- `bun run lint`: 0 errors in my files. (1 pre-existing error remains in `src/components/admin/overview.tsx:111`, which is owned by another agent.)
- Dev server compiles & serves all routes successfully (`/`, `/api/products?...`, `/api/products/[slug]`).
- API contracts verified by curl:
  - `GET /api/products?category=restroom-paper&ply=2&sort=price-asc` → returns 3 products with `effectivePrice`/`isCustomPrice`/`discountPercent` fields.
  - `GET /api/products/jumbo-bath-tissue-2-ply` → returns `{ product, related }`.
