import type {
  Product,
  Company,
  Order,
  Invoice,
  BlogPost,
  OrderGuide,
  Category as CategoryDTO,
  WholesaleLead,
  Address,
  User,
  PricingTier,
  ApprovalRequest,
  OrderItem,
} from './types'

// Convert raw Prisma rows (with JSON strings) to typed DTOs.
// All prices come back as numbers (Float in SQLite).

export function serializeCategory(c: any): CategoryDTO {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId ?? null,
    icon: c.icon ?? null,
    blurb: c.blurb ?? null,
  }
}

export function serializeProduct(p: any): Product {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    categoryId: p.categoryId,
    category: p.category ? serializeCategory(p.category) : undefined,
    description: p.description,
    specs: safeParse(p.specs, {}),
    certifications: safeParse(p.certifications, []),
    application: safeParse(p.application, []),
    unit: p.unit,
    casePackSize: p.casePackSize,
    basePrice: p.basePrice,
    images: safeParse(p.images, []),
    sustainabilityMetrics: safeParse(p.sustainabilityMetrics, {
      recycledContent: '0%',
      treesSavedPerCase: 0,
      plasticSavedLbs: 0,
    }),
    sdsUrl: p.sdsUrl ?? null,
    techSheetUrl: p.techSheetUrl ?? null,
    status: p.status,
    bestSeller: p.bestSeller,
    rating: p.rating,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
  }
}

export function serializeCompany(c: any): Company {
  return {
    id: c.id,
    name: c.name,
    status: c.status,
    pricingTierId: c.pricingTierId ?? null,
    pricingTierName: c.pricingTier?.name,
    discountPercent: c.pricingTier?.discountPercent,
    netTermsDays: c.netTermsDays,
    approvalThreshold: c.approvalThreshold,
    businessType: c.businessType ?? null,
    monthlyVolume: c.monthlyVolume ?? null,
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
  }
}

export function serializeUser(u: any): User & { companyName?: string } {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    companyId: u.companyId ?? null,
    companyName: u.company?.name,
    createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
  }
}

export function serializeAddress(a: any): Address {
  return {
    id: a.id,
    companyId: a.companyId,
    label: a.label,
    line1: a.line1,
    line2: a.line2 ?? null,
    city: a.city,
    state: a.state,
    zip: a.zip,
    type: a.type,
  }
}

export function serializePricingTier(t: any): PricingTier {
  return { id: t.id, name: t.name, discountPercent: t.discountPercent }
}

export function serializeOrderItem(i: any): OrderItem {
  return {
    id: i.id,
    orderId: i.orderId,
    productId: i.productId,
    productName: i.productName,
    sku: i.sku,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    product: i.product ? serializeProduct(i.product) : undefined,
  }
}

export function serializeApproval(a: any): ApprovalRequest {
  return {
    id: a.id,
    orderId: a.orderId,
    requestedBy: a.requestedBy,
    requestedByName: a.requestedByUser?.name,
    approverId: a.approverId ?? null,
    approverName: a.approverUser?.name,
    status: a.status,
    notes: a.notes ?? null,
    createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt,
    resolvedAt: a.resolvedAt instanceof Date ? a.resolvedAt.toISOString() : a.resolvedAt ?? null,
  }
}

export function serializeOrder(o: any): Order {
  return {
    id: o.id,
    orderNumber: o.poNumber ? `#${o.poNumber.replace('PO-', '')}` : `#${o.id.slice(-6)}`,
    companyId: o.companyId,
    companyName: o.company?.name,
    userId: o.userId,
    userName: o.user?.name,
    poNumber: o.poNumber ?? null,
    status: o.status,
    deliveryDate: o.deliveryDate instanceof Date ? o.deliveryDate.toISOString() : o.deliveryDate ?? null,
    shippingAddressJson: o.shippingAddressJson ?? null,
    subtotal: o.subtotal,
    total: o.total,
    sustainabilitySummary: o.sustainabilitySummary
      ? safeParse(o.sustainabilitySummary, null)
      : null,
    carrier: o.carrier ?? null,
    trackingNumber: o.trackingNumber ?? null,
    notes: o.notes ?? null,
    createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
    updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : o.updatedAt,
    items: (o.items ?? []).map(serializeOrderItem),
    approval: o.approval ? serializeApproval(o.approval) : null,
    invoice: o.invoice ? serializeInvoice(o.invoice) : null,
  }
}

export function serializeInvoice(i: any): Invoice {
  return {
    id: i.id,
    companyId: i.companyId,
    companyName: i.company?.name,
    orderId: i.orderId,
    orderNumber: i.order?.poNumber ? `#${i.order.poNumber.replace('PO-', '')}` : undefined,
    invoiceNumber: i.invoiceNumber,
    amount: i.amount,
    dueDate: i.dueDate instanceof Date ? i.dueDate.toISOString() : i.dueDate,
    status: i.status,
    pdfUrl: i.pdfUrl ?? null,
    createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : i.createdAt,
    paidAt: i.paidAt instanceof Date ? i.paidAt.toISOString() : i.paidAt ?? null,
  }
}

export function serializeBlogPost(b: any): BlogPost {
  return {
    id: b.id,
    title: b.title,
    slug: b.slug,
    excerpt: b.excerpt,
    content: b.content,
    author: b.author,
    tags: safeParse(b.tags, []),
    coverImage: b.coverImage ?? null,
    publishedAt: b.publishedAt instanceof Date ? b.publishedAt.toISOString() : b.publishedAt ?? null,
    createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
  }
}

export function serializeOrderGuide(g: any): OrderGuide {
  return {
    id: g.id,
    companyId: g.companyId,
    userId: g.userId,
    name: g.name,
    items: safeParse(g.items, []),
    createdAt: g.createdAt instanceof Date ? g.createdAt.toISOString() : g.createdAt,
  }
}

export function serializeLead(l: any): WholesaleLead {
  return {
    id: l.id,
    companyName: l.companyName,
    contactName: l.contactName,
    email: l.email,
    phone: l.phone ?? null,
    businessType: l.businessType ?? null,
    monthlyVolume: l.monthlyVolume ?? null,
    message: l.message ?? null,
    status: l.status,
    createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt,
  }
}

function safeParse<T>(v: string | null | undefined, fallback: T): T {
  if (!v) return fallback
  try {
    return JSON.parse(v) as T
  } catch {
    return fallback
  }
}

// Helper to build a company-context for pricing resolution
export function buildCompanyContext(company: any) {
  return {
    discountPercent: company?.pricingTier?.discountPercent ?? 0,
    priceOverrides: (company?.priceOverrides ?? []).map((o: any) => ({
      productId: o.productId,
      price: o.price,
    })),
  }
}
