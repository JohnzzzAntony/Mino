// Shared type definitions for MINO SUPPLIERS
// These mirror the Prisma models but use real arrays/objects (parsed from JSON strings)

export interface Category {
  id: string
  name: string
  slug: string
  parentId?: string | null
  icon?: string | null
  blurb?: string | null
}

export interface ProductSpecs {
  ply?: number
  sheetSize?: string
  sheetsPerRoll?: number
  rollsPerCase?: number
  dimensions?: string
  color?: string
  material?: string
  [k: string]: string | number | undefined
}

export interface SustainabilityMetrics {
  recycledContent: string
  treesSavedPerCase: number
  plasticSavedLbs: number
  waterSavedGal?: number
  energySavedKwh?: number
}

export interface Product {
  id: string
  sku: string
  name: string
  slug: string
  categoryId: string
  category?: Category
  description: string
  specs: ProductSpecs
  certifications: string[]
  application: string[]
  unit: string
  casePackSize: number
  basePrice: number
  images: string[]
  sustainabilityMetrics: SustainabilityMetrics
  sdsUrl?: string | null
  techSheetUrl?: string | null
  status: string
  bestSeller: boolean
  rating: number
  createdAt: string
}

export interface Company {
  id: string
  name: string
  status: string
  pricingTierId?: string | null
  pricingTierName?: string
  discountPercent?: number
  netTermsDays: number
  approvalThreshold: number
  businessType?: string | null
  monthlyVolume?: string | null
  createdAt: string
}

export interface User {
  id: string
  email: string
  name: string
  role: 'purchaser' | 'approver' | 'owner' | 'admin'
  companyId?: string | null
  companyName?: string
  createdAt: string
}

export interface Address {
  id: string
  companyId: string
  label: string
  line1: string
  line2?: string | null
  city: string
  state: string
  zip: string
  type: 'billing' | 'shipping'
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  product?: Product
}

export interface Order {
  id: string
  orderNumber?: string
  companyId: string
  companyName?: string
  userId: string
  userName?: string
  poNumber?: string | null
  status:
    | 'draft'
    | 'pending_approval'
    | 'approved'
    | 'submitted'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'invoiced'
  deliveryDate?: string | null
  shippingAddressJson?: string | null
  subtotal: number
  total: number
  sustainabilitySummary?: any
  carrier?: string | null
  trackingNumber?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  approval?: ApprovalRequest | null
  invoice?: Invoice | null
}

export interface ApprovalRequest {
  id: string
  orderId: string
  requestedBy: string
  requestedByName?: string
  approverId?: string | null
  approverName?: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string | null
  createdAt: string
  resolvedAt?: string | null
}

export interface Invoice {
  id: string
  companyId: string
  companyName?: string
  orderId: string
  orderNumber?: string
  invoiceNumber: string
  amount: number
  dueDate: string
  status: 'open' | 'paid' | 'overdue'
  pdfUrl?: string | null
  createdAt: string
  paidAt?: string | null
}

export interface WholesaleLead {
  id: string
  companyName: string
  contactName: string
  email: string
  phone?: string | null
  businessType?: string | null
  monthlyVolume?: string | null
  message?: string | null
  status: 'new' | 'contacted' | 'approved' | 'rejected'
  createdAt: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  tags: string[]
  coverImage?: string | null
  publishedAt?: string | null
  createdAt: string
}

export interface OrderGuide {
  id: string
  companyId: string
  userId: string
  name: string
  items: { productId: string; quantity: number; productName?: string; sku?: string; unitPrice?: number }[]
  createdAt: string
}

export interface PricingTier {
  id: string
  name: string
  discountPercent: number
}
