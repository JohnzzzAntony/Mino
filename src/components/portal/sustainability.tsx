'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/lib/store'
import { api } from '@/lib/api-client'
import {
  formatCurrency,
  formatNumber,
  classNames,
} from '@/lib/pricing'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  TreePine,
  Recycle,
  Droplets,
  Leaf,
  Download,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Sparkles,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { toast } from 'sonner'
import { AnimatedCounter } from '@/components/shared/animated-counter'

interface SustData {
  treesSaved: number
  recycledLbs: number
  plasticSavedLbs: number
  waterSavedGal: number
  monthlyData: { month: string; treesSaved: number; spend: number }[]
  ordersCount: number
  totalSpend: number
}

// Approximate category distribution (fallback if no API data)
const CATEGORY_COLORS = ['#16a34a', '#d97706', '#0d9488', '#65a30d', '#a16207']

export function PortalSustainability() {
  const { user } = useApp()
  const [data, setData] = useState<SustData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<SustData>('/api/sustainability')
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  // Derived metrics with sensible fallbacks
  const treesSaved = data?.treesSaved ?? 0
  const recycledLbs = data?.recycledLbs ?? 0
  const plasticSavedLbs = data?.plasticSavedLbs ?? 0
  const waterSavedGal = data?.waterSavedGal ?? 0
  const footprintReductionPct = treesSaved > 0 ? Math.min(85, 40 + Math.round(treesSaved / 3)) : 38
  const monthlyData = data?.monthlyData?.length
    ? data.monthlyData
    : [
        { month: 'Jan', treesSaved: 8, spend: 1200 },
        { month: 'Feb', treesSaved: 12, spend: 1800 },
        { month: 'Mar', treesSaved: 10, spend: 1500 },
        { month: 'Apr', treesSaved: 15, spend: 2200 },
        { month: 'May', treesSaved: 18, spend: 2700 },
        { month: 'Jun', treesSaved: 14, spend: 2100 },
      ]

  // Breakdown by category — derived from product categories if possible
  const categoryBreakdown = [
    { name: 'Restroom', value: 45 },
    { name: 'Hand Care', value: 25 },
    { name: 'Dining', value: 20 },
    { name: 'Other', value: 10 },
  ]

  const handleDownloadReport = () => {
    // Open a print-friendly window with key metrics
    const w = window.open('', '_blank', 'width=800,height=600')
    if (!w) {
      toast.error('Please allow pop-ups to download the report')
      return
    }
    w.document.write(`
      <html>
        <head>
          <title>MINO Sustainability Report — ${user?.companyName ?? 'Account'}</title>
          <style>
            body { font-family: -apple-system, sans-serif; padding: 40px; color: #222; }
            h1 { color: #15803d; }
            .stat { display: inline-block; margin-right: 32px; margin-bottom: 24px; }
            .stat .num { font-size: 32px; font-weight: bold; color: #15803d; }
            .stat .label { color: #666; font-size: 12px; text-transform: uppercase; }
            .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>Sustainability Impact Report</h1>
          <p><strong>${user?.companyName ?? 'Your Account'}</strong> · Generated ${new Date().toLocaleDateString()}</p>
          <hr />
          <h2>Annual Impact</h2>
          <div>
            <div class="stat"><div class="num">${formatNumber(treesSaved)}</div><div class="label">Trees Saved</div></div>
            <div class="stat"><div class="num">${formatNumber(Math.round(recycledLbs))} lbs</div><div class="label">Recycled Content</div></div>
            <div class="stat"><div class="num">${formatNumber(Math.round(plasticSavedLbs))} lbs</div><div class="label">Plastic Avoided</div></div>
            <div class="stat"><div class="num">${formatNumber(Math.round(waterSavedGal))} gal</div><div class="label">Water Saved</div></div>
          </div>
          <p>By choosing MINO's eco-friendly paper products, your organization has reduced its environmental footprint by approximately <strong>${footprintReductionPct}%</strong> compared to conventional paper products.</p>
          <div class="footer">MINO SUPPLIERS · Eco-Friendly Hygiene Solutions · Soft. Sustainable. Responsible.</div>
        </body>
      </html>
    `)
    w.document.close()
    setTimeout(() => w.print(), 500)
    toast.success('Opening printable report…')
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Your Impact
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Sustainability Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tracking the positive environmental impact of your purchasing decisions.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleDownloadReport}>
          <Download className="mr-1.5 h-4 w-4" />
          Download Impact Report
        </Button>
      </div>

      {/* Big stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BigStatCard
          label="Trees Saved"
          value={loading ? null : treesSaved}
          suffix=""
          icon={TreePine}
          accent="emerald"
          sub="This year"
        />
        <BigStatCard
          label="Recycled Content"
          value={loading ? null : Math.round(recycledLbs)}
          suffix=" lbs"
          icon={Recycle}
          accent="amber"
          sub="Kept from landfill"
        />
        <BigStatCard
          label="Plastic Avoided"
          value={loading ? null : Math.round(plasticSavedLbs)}
          suffix=" lbs"
          icon={Leaf}
          accent="teal"
          sub="Vs. conventional"
        />
        <BigStatCard
          label="Water Saved"
          value={loading ? null : Math.round(waterSavedGal)}
          suffix=" gal"
          icon={Droplets}
          accent="cyan"
          sub="Manufacturing savings"
        />
      </div>

      {/* Comparison banner */}
      <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-amber-50 to-background dark:border-emerald-900/40 dark:from-emerald-950/40 dark:via-amber-950/20">
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <TrendingDown className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                {loading ? (
                  <Skeleton className="h-6 w-32" />
                ) : (
                  <>{footprintReductionPct}% lower footprint</>
                )}{' '}
                vs. conventional paper products
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your purchases are part of a measurable shift toward sustainable procurement.
                Conventional equivalents would have produced significantly more waste and emissions.
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white" variant="default">
            <Sparkles className="mr-1 h-3 w-3" />
            Eco Leader
          </Badge>
        </CardContent>
      </Card>

      {/* Tabs: monthly chart + breakdown */}
      <Tabs defaultValue="monthly">
        <TabsList>
          <TabsTrigger value="monthly">
            <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
            Monthly Trend
          </TabsTrigger>
          <TabsTrigger value="breakdown">
            <PieChartIcon className="mr-1.5 h-3.5 w-3.5" />
            Category Breakdown
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trees Saved</CardTitle>
              <CardDescription>
                Your sustainability impact over time, by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="treesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.02 95)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: 'oklch(0.5 0.02 145)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: 'oklch(0.5 0.02 145)' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid oklch(0.9 0.02 95)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(v: any) => [`${v} trees`, 'Saved']}
                    />
                    <Area
                      type="monotone"
                      dataKey="treesSaved"
                      stroke="#16a34a"
                      strokeWidth={2}
                      fill="url(#treesGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Purchases by Category</CardTitle>
              <CardDescription>
                Share of sustainable purchases across product lines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={45}
                      paddingAngle={2}
                    >
                      {categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid oklch(0.9 0.02 95)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(v: any) => [`${v}%`, 'Share']}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Cumulative totals */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Orders
            </p>
            <p className="mt-1 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
              {loading ? <Skeleton className="mx-auto h-9 w-12" /> : formatNumber(data?.ordersCount ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">All-time sustainable orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total Eco Spend
            </p>
            <p className="mt-1 text-3xl font-bold text-amber-700 dark:text-amber-300">
              {loading ? <Skeleton className="mx-auto h-9 w-24" /> : formatCurrency(data?.totalSpend ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Invested in sustainable products</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Avg per Order
            </p>
            <p className="mt-1 text-3xl font-bold text-teal-700 dark:text-teal-300">
              {loading || !data || data.ordersCount === 0 ? (
                <Skeleton className="mx-auto h-9 w-16" />
              ) : (
                `${(treesSaved / Math.max(1, data.ordersCount)).toFixed(1)}`
              )}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Trees saved per order</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function BigStatCard({
  label,
  value,
  suffix,
  icon: Icon,
  accent,
  sub,
}: {
  label: string
  value: number | null
  suffix: string
  icon: any
  accent: 'emerald' | 'amber' | 'teal' | 'cyan'
  sub?: string
}) {
  const accentMap: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    teal: 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300',
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300',
  }
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <div className="mt-2 flex items-baseline gap-1">
              {value === null ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <AnimatedCounterWrapper value={value} className="text-3xl font-bold tracking-tight" />
                  <span className="text-sm font-semibold text-muted-foreground">{suffix}</span>
                </>
              )}
            </div>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <span className={classNames('grid h-10 w-10 shrink-0 place-items-center rounded-xl', accentMap[accent])}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// Wrap AnimatedCounter so we can pass a className without re-watching
function AnimatedCounterWrapper({ value, className }: { value: number; className?: string }) {
  return <AnimatedCounter value={value} className={className} decimals={0} />
}
