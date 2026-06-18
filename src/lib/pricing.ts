import type { Product, Company } from './types'

// Resolve the effective price for a product given a company's pricing context.
// Priority: per-product override > tier discount > base price.
export function resolvePrice(
  product: { basePrice: number },
  company?: {
    discountPercent?: number
    priceOverrides?: { productId: string; price: number }[]
  } | null,
  overridePrice?: number | null
): { price: number; isCustom: boolean; discountPercent: number } {
  if (overridePrice != null) {
    return { price: overridePrice, isCustom: true, discountPercent: 0 }
  }
  if (company?.priceOverrides?.length) {
    const ov = company.priceOverrides.find((o) => o.productId === (product as any).id)
    if (ov) return { price: ov.price, isCustom: true, discountPercent: 0 }
  }
  const discount = company?.discountPercent ?? 0
  if (discount > 0) {
    return {
      price: round2(product.basePrice * (1 - discount / 100)),
      isCustom: true,
      discountPercent: discount,
    }
  }
  return { price: product.basePrice, isCustom: false, discountPercent: 0 }
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    pending_approval: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    approved: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
    submitted: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
    processing: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
    shipped: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
    delivered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    invoiced: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    open: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    new: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200',
    contacted: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    approved_lead: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
    discontinued: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    suspended: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    approved_status: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  }
  return map[status] ?? 'bg-muted text-muted-foreground'
}

export function prettifyStatus(status: string): string {
  return status
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function classNames(...xs: (string | false | null | undefined)[]): string {
  return xs.filter(Boolean).join(' ')
}
