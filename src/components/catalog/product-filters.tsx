'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Filter,
  X,
  Layers,
  Building2,
  BadgeCheck,
  FolderTree,
} from 'lucide-react'
import type { Category } from '@/lib/types'

export interface FilterState {
  category?: string | undefined
  ply: number[]
  applications: string[]
  certifications: string[]
}

interface ProductFiltersProps {
  categories: Category[]
  state: FilterState
  onChange: (next: FilterState) => void
  onClear: () => void
  /** optional counts to show next to each category */
  categoryCounts?: Record<string, number>
  className?: string
}

const PLY_OPTIONS = [
  { value: 1, label: '1-Ply' },
  { value: 2, label: '2-Ply' },
]

const APPLICATION_OPTIONS = [
  { value: 'household', label: 'Household' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'hotel', label: 'Hotel' },
]

const CERTIFICATION_OPTIONS = [
  'Green Seal',
  'FSC',
  'EPA Safer Choice',
  'Compostable',
]

export function ProductFilters({
  categories,
  state,
  onChange,
  onClear,
  categoryCounts,
  className,
}: ProductFiltersProps) {
  const togglePly = (p: number) => {
    onChange({
      ...state,
      ply: state.ply.includes(p)
        ? state.ply.filter((x) => x !== p)
        : [...state.ply, p],
    })
  }

  const toggleApp = (a: string) => {
    onChange({
      ...state,
      applications: state.applications.includes(a)
        ? state.applications.filter((x) => x !== a)
        : [...state.applications, a],
    })
  }

  const toggleCert = (c: string) => {
    onChange({
      ...state,
      certifications: state.certifications.includes(c)
        ? state.certifications.filter((x) => x !== c)
        : [...state.certifications, c],
    })
  }

  // Category is radio-like — only one at a time (API constraint)
  const setCategory = (slug: string | undefined) => {
    onChange({ ...state, category: slug })
  }

  const hasActive =
    !!state.category ||
    state.ply.length > 0 ||
    state.applications.length > 0 ||
    state.certifications.length > 0

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between px-1 pb-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Filter className="h-4 w-4 text-primary" />
          Filters
        </div>
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="mr-1 h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      <Separator className="mb-3" />

      <ScrollArea className="max-h-[calc(100vh-12rem)] pr-3">
        <div className="space-y-6">
          {/* Categories */}
          <section>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <FolderTree className="h-3.5 w-3.5" />
              Category
            </div>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm hover:bg-accent/50">
                <Checkbox
                  checked={!state.category}
                  onCheckedChange={() => setCategory(undefined)}
                />
                <span className="flex-1">All products</span>
              </label>
              {categories.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm hover:bg-accent/50"
                >
                  <Checkbox
                    checked={state.category === c.slug}
                    onCheckedChange={() =>
                      setCategory(state.category === c.slug ? undefined : c.slug)
                    }
                  />
                  <span className="flex-1">{c.name}</span>
                  {categoryCounts?.[c.slug] !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {categoryCounts[c.slug]}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </section>

          {/* Ply */}
          <section>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              Ply Count
            </div>
            <div className="space-y-2">
              {PLY_OPTIONS.map((p) => (
                <label
                  key={p.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm hover:bg-accent/50"
                >
                  <Checkbox
                    checked={state.ply.includes(p.value)}
                    onCheckedChange={() => togglePly(p.value)}
                  />
                  <span className="flex-1">{p.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Application */}
          <section>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Application
            </div>
            <div className="space-y-2">
              {APPLICATION_OPTIONS.map((a) => (
                <label
                  key={a.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm hover:bg-accent/50"
                >
                  <Checkbox
                    checked={state.applications.includes(a.value)}
                    onCheckedChange={() => toggleApp(a.value)}
                  />
                  <span className="flex-1">{a.label}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Certifications */}
          <section>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <BadgeCheck className="h-3.5 w-3.5" />
              Certifications
            </div>
            <div className="space-y-2">
              {CERTIFICATION_OPTIONS.map((c) => (
                <label
                  key={c}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm hover:bg-accent/50"
                >
                  <Checkbox
                    checked={state.certifications.includes(c)}
                    onCheckedChange={() => toggleCert(c)}
                  />
                  <span className="flex-1">{c}</span>
                </label>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>
    </div>
  )
}
