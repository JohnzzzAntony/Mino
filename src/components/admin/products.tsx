'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/hooks/use-toast'
import {
  Search,
  RefreshCw,
  Plus,
  Pencil,
  Trash2,
  Star,
  Package,
  Download,
  X,
  ImageOff,
} from 'lucide-react'
import {
  formatCurrency,
  formatDate,
  statusColor,
  prettifyStatus,
  classNames,
} from '@/lib/pricing'
import type { Product, Category } from '@/lib/types'
import { ErrorState, EmptyState, TableSkeleton } from './leads'

const CERT_OPTIONS = ['FSC', 'Green Seal', 'EcoLogo', 'EPA Safer Choice', 'BPI Compostable', 'SFI']
const APP_OPTIONS = ['hotel', 'restaurant', 'janitorial', 'office', 'household', 'commercial', 'industrial']
const UNIT_OPTIONS = ['case', 'roll', 'each', 'carton', 'pallet']

interface ProductFormState {
  id?: string
  sku: string
  name: string
  slug: string
  categoryId: string
  description: string
  basePrice: number
  unit: string
  casePackSize: number
  specs: { ply?: number; sheetSize?: string; sheetsPerRoll?: number; rollsPerCase?: number; dimensions?: string; material?: string; color?: string }
  certifications: string[]
  application: string[]
  images: string
  sustainabilityMetrics: { recycledContent: string; treesSavedPerCase: number; plasticSavedLbs: number; waterSavedGal?: number; energySavedKwh?: number }
  status: string
  bestSeller: boolean
}

const EMPTY_FORM: ProductFormState = {
  sku: '',
  name: '',
  slug: '',
  categoryId: '',
  description: '',
  basePrice: 0,
  unit: 'case',
  casePackSize: 1,
  specs: {},
  certifications: [],
  application: [],
  images: '',
  sustainabilityMetrics: { recycledContent: '80%', treesSavedPerCase: 0, plasticSavedLbs: 0 },
  status: 'active',
  bestSeller: false,
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/admin/products').then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch('/api/categories').then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ])
      if (!prodRes) {
        setError(true)
        return
      }
      setProducts(prodRes.products ?? [])
      setCategories(catRes?.categories ?? catRes ?? [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    return products
      .filter((p) => categoryFilter === 'all' || p.categoryId === categoryFilter)
      .filter((p) => statusFilter === 'all' || p.status === statusFilter)
      .filter((p) => {
        if (!search) return true
        const q = search.toLowerCase()
        return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      })
      .sort((a, b) => (b.bestSeller ? 1 : 0) - (a.bestSeller ? 1 : 0) || a.name.localeCompare(b.name))
  }, [products, categoryFilter, statusFilter, search])

  function openCreate() {
    setForm({ ...EMPTY_FORM, categoryId: categories[0]?.id ?? '' })
    setFormOpen(true)
  }

  function openEdit(p: Product) {
    setForm({
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      categoryId: p.categoryId,
      description: p.description,
      basePrice: p.basePrice,
      unit: p.unit,
      casePackSize: p.casePackSize,
      specs: p.specs ?? {},
      certifications: p.certifications ?? [],
      application: p.application ?? [],
      images: (p.images ?? []).join(', '),
      sustainabilityMetrics: p.sustainabilityMetrics ?? {
        recycledContent: '80%',
        treesSavedPerCase: 0,
        plasticSavedLbs: 0,
      },
      status: p.status,
      bestSeller: p.bestSeller,
    })
    setFormOpen(true)
  }

  async function save() {
    if (!form.sku || !form.name || !form.categoryId) {
      toast({ title: 'Missing fields', description: 'SKU, name, and category are required.', variant: 'destructive' })
      return
    }
    setSaving(true)
    const payload = {
      sku: form.sku,
      name: form.name,
      slug: form.slug || slugify(form.name),
      categoryId: form.categoryId,
      description: form.description,
      basePrice: Number(form.basePrice) || 0,
      unit: form.unit,
      casePackSize: Number(form.casePackSize) || 1,
      specs: form.specs,
      certifications: form.certifications,
      application: form.application,
      images: form.images.split(',').map((s) => s.trim()).filter(Boolean),
      sustainabilityMetrics: form.sustainabilityMetrics,
      status: form.status,
      bestSeller: form.bestSeller,
    }
    try {
      let res: Response
      if (form.id) {
        res = await fetch(`/api/admin/products/${form.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      if (!res.ok) throw new Error()
      toast({
        title: form.id ? 'Product updated' : 'Product created',
        description: `${form.name} has been saved.`,
      })
      setFormOpen(false)
      await load()
    } catch {
      toast({ title: 'Save failed', description: 'Could not save product.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function doDelete(p: Product) {
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast({ title: 'Product removed', description: `${p.name} has been discontinued.` })
      setDeleteTarget(null)
      await load()
    } catch {
      toast({ title: 'Delete failed', description: 'Could not remove product.', variant: 'destructive' })
    }
  }

  function exportCsv() {
    const headers = ['SKU', 'Name', 'Category', 'Base Price', 'Unit', 'Case Pack', 'Status', 'Best Seller', 'Created']
    const rows = filtered.map((p) => [
      p.sku,
      p.name,
      p.category?.name ?? '',
      p.basePrice,
      p.unit,
      p.casePackSize,
      p.status,
      p.bestSeller ? 'yes' : 'no',
      new Date(p.createdAt).toISOString(),
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    downloadCsv(csv, 'mino-products.csv')
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">Manage the catalog — prices, certifications, sustainability.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={classNames('mr-1.5 h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
            <Download className="mr-1.5 h-4 w-4" />
            Export
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add product
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name or SKU…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger size="sm" className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger size="sm" className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="discontinued">Discontinued</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {error ? (
            <ErrorState onRetry={load} />
          ) : loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Package} title="No products found" subtitle={search || categoryFilter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Add your first product to get started.'} />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[280px]">Product</TableHead>
                    <TableHead className="hidden md:table-cell">SKU</TableHead>
                    <TableHead className="hidden lg:table-cell">Category</TableHead>
                    <TableHead className="text-right">Base price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Best seller</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-muted">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <ImageOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-medium">{p.name}</p>
                              {p.bestSeller && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                            </div>
                            <p className="text-xs text-muted-foreground md:hidden">{p.sku}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell font-mono text-xs">{p.sku}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{p.category?.name ?? '—'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.basePrice)} <span className="text-xs text-muted-foreground">/{p.unit}</span></TableCell>
                      <TableCell>
                        <Badge className={statusColor(p.status)} variant="outline">{prettifyStatus(p.status)}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {p.bestSeller ? <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">Yes</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(p)} className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit product' : 'Add product'}</DialogTitle>
            <DialogDescription>
              {form.id ? `Editing ${form.name}` : 'Create a new catalog entry.'} Fields marked * are required.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="SKU *">
                <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="TP-2PLY-CT" />
              </Field>
              <Field label="Name *">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: form.slug || slugify(e.target.value) })} placeholder="2-Ply Bath Tissue, Case" />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Slug">
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-from-name" />
              </Field>
              <Field label="Category *">
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Description">
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Product description for catalog and portal." />
            </Field>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Base price ($)">
                <Input type="number" step="0.01" min="0" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: Number(e.target.value) })} />
              </Field>
              <Field label="Unit">
                <Select value={form.unit} onValueChange={(v) => setForm({ ...form, unit: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Case pack size">
                <Input type="number" min="1" value={form.casePackSize} onChange={(e) => setForm({ ...form, casePackSize: Number(e.target.value) })} />
              </Field>
            </div>

            <Separator />

            <div>
              <Label className="mb-2 block">Specs</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Ply">
                  <Input type="number" min="1" value={form.specs.ply ?? ''} onChange={(e) => setForm({ ...form, specs: { ...form.specs, ply: e.target.value ? Number(e.target.value) : undefined } })} />
                </Field>
                <Field label="Sheet size">
                  <Input value={form.specs.sheetSize ?? ''} onChange={(e) => setForm({ ...form, specs: { ...form.specs, sheetSize: e.target.value } })} placeholder='4.5" x 4.0"' />
                </Field>
                <Field label="Sheets / roll">
                  <Input type="number" value={form.specs.sheetsPerRoll ?? ''} onChange={(e) => setForm({ ...form, specs: { ...form.specs, sheetsPerRoll: e.target.value ? Number(e.target.value) : undefined } })} />
                </Field>
                <Field label="Rolls / case">
                  <Input type="number" value={form.specs.rollsPerCase ?? ''} onChange={(e) => setForm({ ...form, specs: { ...form.specs, rollsPerCase: e.target.value ? Number(e.target.value) : undefined } })} />
                </Field>
                <Field label="Dimensions">
                  <Input value={form.specs.dimensions ?? ''} onChange={(e) => setForm({ ...form, specs: { ...form.specs, dimensions: e.target.value } })} />
                </Field>
                <Field label="Material">
                  <Input value={form.specs.material ?? ''} onChange={(e) => setForm({ ...form, specs: { ...form.specs, material: e.target.value } })} />
                </Field>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ChipPicker
                label="Certifications"
                options={CERT_OPTIONS}
                selected={form.certifications}
                onToggle={(v) =>
                  setForm({
                    ...form,
                    certifications: form.certifications.includes(v)
                      ? form.certifications.filter((c) => c !== v)
                      : [...form.certifications, v],
                  })
                }
              />
              <ChipPicker
                label="Applications"
                options={APP_OPTIONS}
                selected={form.application}
                onToggle={(v) =>
                  setForm({
                    ...form,
                    application: form.application.includes(v)
                      ? form.application.filter((c) => c !== v)
                      : [...form.application, v],
                  })
                }
              />
            </div>

            <Field label="Image URLs (comma-separated)">
              <Input value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} placeholder="/images/product-tissue.jpg, /images/another.jpg" />
            </Field>

            <div>
              <Label className="mb-2 block">Sustainability metrics</Label>
              <div className="grid gap-3 sm:grid-cols-4">
                <Field label="Recycled content">
                  <Input value={form.sustainabilityMetrics.recycledContent} onChange={(e) => setForm({ ...form, sustainabilityMetrics: { ...form.sustainabilityMetrics, recycledContent: e.target.value } })} placeholder="80%" />
                </Field>
                <Field label="Trees saved / case">
                  <Input type="number" step="0.1" value={form.sustainabilityMetrics.treesSavedPerCase} onChange={(e) => setForm({ ...form, sustainabilityMetrics: { ...form.sustainabilityMetrics, treesSavedPerCase: Number(e.target.value) } })} />
                </Field>
                <Field label="Plastic saved (lbs)">
                  <Input type="number" step="0.1" value={form.sustainabilityMetrics.plasticSavedLbs} onChange={(e) => setForm({ ...form, sustainabilityMetrics: { ...form.sustainabilityMetrics, plasticSavedLbs: Number(e.target.value) } })} />
                </Field>
                <Field label="Water saved (gal)">
                  <Input type="number" value={form.sustainabilityMetrics.waterSavedGal ?? ''} onChange={(e) => setForm({ ...form, sustainabilityMetrics: { ...form.sustainabilityMetrics, waterSavedGal: e.target.value ? Number(e.target.value) : undefined } })} />
                </Field>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="discontinued">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <label className="flex items-end gap-2 pb-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.bestSeller}
                  onChange={(e) => setForm({ ...form, bestSeller: e.target.checked })}
                  className="h-4 w-4 rounded border-input"
                />
                Mark as best seller
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : form.id ? 'Save changes' : 'Create product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The product will be marked as <span className="font-medium text-foreground">discontinued</span> and removed from the active catalog. Existing orders and invoices are unaffected. This action can be reversed by editing the product.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && doDelete(deleteTarget)}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Remove product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  )
}

function ChipPicker({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = selected.includes(o)
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              className={classNames(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted'
              )}
            >
              {active && <X className="mr-0.5 inline h-3 w-3" />}
              {prettifyStatus(o)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

