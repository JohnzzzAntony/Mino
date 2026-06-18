// Seed script for MINO SUPPLIERS
// Run with: bun run src/lib/seed.ts
import { db } from './db'

async function main() {
  console.log('🌱 Seeding MINO SUPPLIERS database...')

  // Clean slate
  await db.contactMessage.deleteMany()
  await db.newsletterSignup.deleteMany()
  await db.invoice.deleteMany()
  await db.approvalRequest.deleteMany()
  await db.orderItem.deleteMany()
  await db.order.deleteMany()
  await db.orderGuide.deleteMany()
  await db.productPriceOverride.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()
  await db.pricingTier.deleteMany()
  await db.address.deleteMany()
  await db.user.deleteMany()
  await db.company.deleteMany()
  await db.wholesaleLead.deleteMany()
  await db.blogPost.deleteMany()

  // ---- Pricing tiers ----
  const tier1 = await db.pricingTier.create({
    data: { name: 'Tier 1 — Volume', discountPercent: 5 },
  })
  const tier2 = await db.pricingTier.create({
    data: { name: 'Tier 2 — Hospitality', discountPercent: 10 },
  })
  const tier3 = await db.pricingTier.create({
    data: { name: 'Tier 3 — Strategic Partner', discountPercent: 15 },
  })

  // ---- Categories ----
  const restroom = await db.category.create({
    data: {
      name: 'Restroom Paper',
      slug: 'restroom-paper',
      icon: 'Toilet',
      blurb: 'Bath tissue & jumbo rolls engineered for softness and strength.',
    },
  })
  const handDry = await db.category.create({
    data: {
      name: 'Hand Drying Paper',
      slug: 'hand-drying-paper',
      icon: 'Hand',
      blurb: 'Multifold, singlefold & roll towels for any dispenser.',
    },
  })
  const dining = await db.category.create({
    data: {
      name: 'Dining Paper',
      slug: 'dining-paper',
      icon: 'Utensils',
      blurb: 'Napkins, placemats & table rolls for restaurants and events.',
    },
  })

  // ---- Products ----
  type SeedProduct = {
    sku: string
    name: string
    slug: string
    categoryId: string
    description: string
    specs: Record<string, string | number>
    certifications: string[]
    application: string[]
    unit: string
    casePackSize: number
    basePrice: number
    sustainabilityMetrics: Record<string, string | number>
    bestSeller?: boolean
    rating?: number
  }

  const products: SeedProduct[] = [
    // Restroom
    {
      sku: '10234',
      name: 'Jumbo Bath Tissue (2-Ply)',
      slug: 'jumbo-bath-tissue-2-ply',
      categoryId: restroom.id,
      description:
        'Premium 2-ply jumbo bath tissue designed for high-traffic restrooms. Soft yet strong, with 80% recycled content and certified by Green Seal and FSC. Each roll delivers 2,000 feet to reduce change-outs and labor.',
      specs: { ply: 2, sheetSize: '4"x4000"', sheetsPerRoll: 2000, rollsPerCase: 12, dimensions: '12" x 12" x 18"' },
      certifications: ['Green Seal', 'FSC', 'EPA Safer Choice'],
      application: ['commercial', 'hotel'],
      unit: 'case',
      casePackSize: 12,
      basePrice: 48.5,
      sustainabilityMetrics: { recycledContent: '80%', treesSavedPerCase: 0.4, plasticSavedLbs: 0.3, waterSavedGal: 220 },
      bestSeller: true,
      rating: 4.7,
    },
    {
      sku: '10235',
      name: 'Standard Bath Tissue (1-Ply)',
      slug: 'standard-bath-tissue-1-ply',
      categoryId: restroom.id,
      description:
        'Economical 1-ply bath tissue for budget-conscious operations. Septic-safe and rapidly dissolving. 1000 sheets per roll, 96 rolls per case for fewer reorder cycles.',
      specs: { ply: 1, sheetSize: '4.5"x4.5"', sheetsPerRoll: 1000, rollsPerCase: 96, dimensions: '20" x 14" x 10"' },
      certifications: ['FSC'],
      application: ['commercial', 'household'],
      unit: 'case',
      casePackSize: 96,
      basePrice: 36.75,
      sustainabilityMetrics: { recycledContent: '70%', treesSavedPerCase: 0.3, plasticSavedLbs: 0.2, waterSavedGal: 180 },
      rating: 4.3,
    },
    {
      sku: '10236',
      name: 'Premium 2-Ply Bath Tissue (Soft)',
      slug: 'premium-2-ply-bath-tissue-soft',
      categoryId: restroom.id,
      description:
        'Hotel-grade 2-ply bath tissue with extra softness for hospitality settings. Lotion-free, hypoallergenic, and septic-safe. 500 sheets per roll, 48 rolls per case.',
      specs: { ply: 2, sheetSize: '4"x4"', sheetsPerRoll: 500, rollsPerCase: 48, dimensions: '14" x 10" x 12"' },
      certifications: ['Green Seal', 'FSC'],
      application: ['hotel', 'household'],
      unit: 'case',
      casePackSize: 48,
      basePrice: 42.0,
      sustainabilityMetrics: { recycledContent: '60%', treesSavedPerCase: 0.25, plasticSavedLbs: 0.2, waterSavedGal: 150 },
      bestSeller: true,
      rating: 4.8,
    },
    {
      sku: '10237',
      name: 'Coreless Bath Tissue (2-Ply)',
      slug: 'coreless-bath-tissue-2-ply',
      categoryId: restroom.id,
      description:
        'Coreless rolls eliminate cardboard waste and fit high-capacity dispensers. 2-ply softness with 9" diameter. 100% recycled fiber.',
      specs: { ply: 2, sheetSize: '4"x3600"', sheetsPerRoll: 900, rollsPerCase: 6, dimensions: '9" x 9" x 12"' },
      certifications: ['Green Seal', 'FSC', 'EPA Safer Choice'],
      application: ['commercial'],
      unit: 'case',
      casePackSize: 6,
      basePrice: 28.25,
      sustainabilityMetrics: { recycledContent: '95%', treesSavedPerCase: 0.5, plasticSavedLbs: 0.4, waterSavedGal: 260 },
      rating: 4.5,
    },

    // Hand drying
    {
      sku: '20301',
      name: 'Multifold Paper Towels (1-Ply)',
      slug: 'multifold-paper-towels-1-ply',
      categoryId: handDry.id,
      description:
        'Multifold (Z-fold) towels compatible with most universal dispensers. Strong and absorbent for hand drying and surface wiping. 250 sheets per pack, 16 packs per case.',
      specs: { ply: 1, sheetSize: '9.5"x10.5"', sheetsPerRoll: 250, rollsPerCase: 16, dimensions: '18" x 12" x 9"' },
      certifications: ['Green Seal', 'FSC'],
      application: ['commercial', 'hotel'],
      unit: 'case',
      casePackSize: 16,
      basePrice: 32.5,
      sustainabilityMetrics: { recycledContent: '85%', treesSavedPerCase: 0.35, plasticSavedLbs: 0.25, waterSavedGal: 200 },
      bestSeller: true,
      rating: 4.6,
    },
    {
      sku: '20302',
      name: 'Singlefold Paper Towels (1-Ply)',
      slug: 'singlefold-paper-towels-1-ply',
      categoryId: handDry.id,
      description:
        'Economical singlefold towels for high-volume restrooms. Quick-drying and absorbent. 4000 sheets per case.',
      specs: { ply: 1, sheetSize: '9.5"x10.5"', sheetsPerRoll: 250, rollsPerCase: 16, dimensions: '18" x 12" x 9"' },
      certifications: ['FSC'],
      application: ['commercial'],
      unit: 'case',
      casePackSize: 16,
      basePrice: 27.0,
      sustainabilityMetrics: { recycledContent: '75%', treesSavedPerCase: 0.3, plasticSavedLbs: 0.2, waterSavedGal: 160 },
      rating: 4.2,
    },
    {
      sku: '20303',
      name: 'Hardwound Roll Towels (2-Ply)',
      slug: 'hardwound-roll-towels-2-ply',
      categoryId: handDry.id,
      description:
        'High-capacity hardwound roll towels for dispenser-mounted systems. 2-ply strength, 8" diameter, 800 feet per roll. Ideal for kitchens and high-traffic restrooms.',
      specs: { ply: 2, sheetSize: '8"x800ft"', sheetsPerRoll: 1000, rollsPerCase: 6, dimensions: '8" x 8" x 16"' },
      certifications: ['Green Seal', 'EPA Safer Choice'],
      application: ['commercial', 'hotel'],
      unit: 'case',
      casePackSize: 6,
      basePrice: 38.75,
      sustainabilityMetrics: { recycledContent: '90%', treesSavedPerCase: 0.45, plasticSavedLbs: 0.35, waterSavedGal: 240 },
      bestSeller: true,
      rating: 4.7,
    },
    {
      sku: '20304',
      name: 'Centerpull Paper Towels (2-Ply)',
      slug: 'centerpull-paper-towels-2-ply',
      categoryId: handDry.id,
      description:
        'Hygienic centerpull towels reduce cross-contamination. 2-ply absorbency with single-sheet dispensing. 6 rolls per case, 600 feet each.',
      specs: { ply: 2, sheetSize: '8"x600ft"', sheetsPerRoll: 800, rollsPerCase: 6, dimensions: '8" x 8" x 14"' },
      certifications: ['FSC'],
      application: ['commercial', 'household'],
      unit: 'case',
      casePackSize: 6,
      basePrice: 35.0,
      sustainabilityMetrics: { recycledContent: '80%', treesSavedPerCase: 0.32, plasticSavedLbs: 0.22, waterSavedGal: 190 },
      rating: 4.4,
    },

    // Dining
    {
      sku: '30401',
      name: 'Beverage Napkins (1-Ply)',
      slug: 'beverage-napkins-1-ply',
      categoryId: dining.id,
      description:
        'Cocktail-size beverage napkins (5" folded) perfect for bars and cafes. Soft, absorbent, and compostable. 1000 napkins per case.',
      specs: { ply: 1, sheetSize: '5"x5" folded', sheetsPerRoll: 1000, rollsPerCase: 1, dimensions: '5" x 5" x 8"' },
      certifications: ['FSC', 'Compostable'],
      application: ['hotel', 'commercial'],
      unit: 'case',
      casePackSize: 1000,
      basePrice: 24.5,
      sustainabilityMetrics: { recycledContent: '100%', treesSavedPerCase: 0.2, plasticSavedLbs: 0.1, waterSavedGal: 120 },
      bestSeller: true,
      rating: 4.5,
    },
    {
      sku: '30402',
      name: 'Dinner Napkins (2-Ply)',
      slug: 'dinner-napkins-2-ply',
      categoryId: dining.id,
      description:
        'Full-size dinner napkins (8" folded) for restaurants and catering. Soft 2-ply with embossed texture. 500 per case.',
      specs: { ply: 2, sheetSize: '8"x8" folded', sheetsPerRoll: 500, rollsPerCase: 1, dimensions: '8" x 8" x 10"' },
      certifications: ['FSC'],
      application: ['hotel', 'commercial'],
      unit: 'case',
      casePackSize: 500,
      basePrice: 31.0,
      sustainabilityMetrics: { recycledContent: '85%', treesSavedPerCase: 0.28, plasticSavedLbs: 0.15, waterSavedGal: 140 },
      rating: 4.6,
    },
    {
      sku: '30403',
      name: 'Table Roll Paper (1-Ply)',
      slug: 'table-roll-paper-1-ply',
      categoryId: dining.id,
      description:
        'Continuous table cover roll for banquets and events. 1-ply kraft, 200 feet per roll, 18" wide. Tear to length, no waste.',
      specs: { ply: 1, sheetSize: '18"x200ft"', sheetsPerRoll: 1, rollsPerCase: 4, dimensions: '18" x 4" x 4"' },
      certifications: ['FSC', 'Compostable'],
      application: ['commercial'],
      unit: 'case',
      casePackSize: 4,
      basePrice: 29.75,
      sustainabilityMetrics: { recycledContent: '95%', treesSavedPerCase: 0.38, plasticSavedLbs: 0.0, waterSavedGal: 180 },
      rating: 4.3,
    },
    {
      sku: '30404',
      name: 'Placemat Paper (Recycled)',
      slug: 'placemat-paper-recycled',
      categoryId: dining.id,
      description:
        'Pre-cut 12"x18" placemats for casual dining and cafeterias. 100% recycled, compostable. 1000 per case.',
      specs: { ply: 1, sheetSize: '12"x18"', sheetsPerRoll: 1000, rollsPerCase: 1, dimensions: '12" x 18" x 6"' },
      certifications: ['FSC', 'Compostable', 'EPA Safer Choice'],
      application: ['commercial', 'household'],
      unit: 'case',
      casePackSize: 1000,
      basePrice: 26.5,
      sustainabilityMetrics: { recycledContent: '100%', treesSavedPerCase: 0.22, plasticSavedLbs: 0.0, waterSavedGal: 130 },
      rating: 4.4,
    },
  ]

  // Map category → product image
  const productImageByCategory: Record<string, string> = {
    [restroom.id]: '/images/product-tissue.jpg',
    [handDry.id]: '/images/product-towels.jpg',
    [dining.id]: '/images/product-napkins.jpg',
  }

  for (const p of products) {
    const img = productImageByCategory[p.categoryId]
    await db.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        slug: p.slug,
        categoryId: p.categoryId,
        description: p.description,
        specs: JSON.stringify(p.specs),
        certifications: JSON.stringify(p.certifications),
        application: JSON.stringify(p.application),
        unit: p.unit,
        casePackSize: p.casePackSize,
        basePrice: p.basePrice,
        images: JSON.stringify([img, img]),
        sustainabilityMetrics: JSON.stringify(p.sustainabilityMetrics),
        sdsUrl: '/sds/sample-sds.pdf',
        techSheetUrl: '/tech/sample-tech.pdf',
        status: 'active',
        bestSeller: p.bestSeller ?? false,
        rating: p.rating ?? 4.5,
      },
    })
  }

  // ---- Demo companies & users ----
  const cedarInn = await db.company.create({
    data: {
      name: 'Cedar Grove Inn',
      status: 'approved',
      pricingTierId: tier2.id,
      netTermsDays: 30,
      approvalThreshold: 500,
      businessType: 'hotel',
      monthlyVolume: 'medium',
    },
  })
  const mapleBistro = await db.company.create({
    data: {
      name: 'Maple & Oak Bistro',
      status: 'approved',
      pricingTierId: tier1.id,
      netTermsDays: 15,
      approvalThreshold: 300,
      businessType: 'restaurant',
      monthlyVolume: 'small',
    },
  })
  const summitJanitorial = await db.company.create({
    data: {
      name: 'Summit Janitorial Co.',
      status: 'approved',
      pricingTierId: tier3.id,
      netTermsDays: 45,
      approvalThreshold: 1500,
      businessType: 'janitorial',
      monthlyVolume: 'large',
    },
  })
  const pendingCo = await db.company.create({
    data: {
      name: 'Riverstone Cafe (Pending)',
      status: 'pending',
      netTermsDays: 30,
      approvalThreshold: 500,
      businessType: 'restaurant',
      monthlyVolume: 'small',
    },
  })

  // Addresses
  await db.address.create({
    data: {
      companyId: cedarInn.id,
      label: 'Main Lodge',
      line1: '142 Cedar Ridge Rd',
      city: 'Asheville',
      state: 'NC',
      zip: '28801',
      type: 'billing',
    },
  })
  await db.address.create({
    data: {
      companyId: cedarInn.id,
      label: 'Spa Building',
      line1: '142 Cedar Ridge Rd',
      line2: 'Bldg B',
      city: 'Asheville',
      state: 'NC',
      zip: '28801',
      type: 'shipping',
    },
  })
  await db.address.create({
    data: {
      companyId: mapleBistro.id,
      label: 'Restaurant',
      line1: '88 Maple Street',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      type: 'billing',
    },
  })
  await db.address.create({
    data: {
      companyId: summitJanitorial.id,
      label: 'Warehouse',
      line1: '5000 Industrial Pkwy',
      city: 'Denver',
      state: 'CO',
      zip: '80216',
      type: 'shipping',
    },
  })

  // Users — include demo passwords
  const adminUser = await db.user.create({
    data: { email: 'admin@mino.supplies', name: 'Mino Admin', role: 'admin', password: 'admin1234' },
  })
  // Price overrides — sample custom pricing
  const jumboBath = await db.product.findUnique({ where: { sku: '10234' } })
  const multifold = await db.product.findUnique({ where: { sku: '20301' } })
  if (jumboBath && summitJanitorial) {
    await db.productPriceOverride.create({
      data: { companyId: summitJanitorial.id, productId: jumboBath.id, price: 44.0 },
    })
  }
  if (multifold && cedarInn) {
    await db.productPriceOverride.create({
      data: { companyId: cedarInn.id, productId: multifold.id, price: 29.5 },
    })
  }

  // Wholesale leads
  await db.wholesaleLead.create({
    data: {
      companyName: 'Riverstone Cafe',
      contactName: 'Jordan River',
      email: 'jordan@riverstonecafe.example',
      phone: '555-0142',
      businessType: 'restaurant',
      monthlyVolume: 'small',
      message: 'Looking for sustainable napkins and towels for our new cafe. Need ~$800/month to start.',
      status: 'new',
    },
  })
  await db.wholesaleLead.create({
    data: {
      companyName: 'Pinecrest Hotel Group',
      contactName: 'Alex Pine',
      email: 'alex@pinecrest.example',
      phone: '555-0199',
      businessType: 'hotel',
      monthlyVolume: 'large',
      message: 'Replacing existing paper supplier across 6 properties. Sustainability matters to us.',
      status: 'contacted',
    },
  })

  // ---- Blog posts ----
  await db.blogPost.create({
    data: {
      title: 'Why Recycled Content Actually Matters in Restroom Paper',
      slug: 'why-recycled-content-matters',
      excerpt:
        'A deep dive into how choosing 80%+ recycled content restroom paper saves forests, water, and your bottom line.',
      content: `# Why Recycled Content Actually Matters

When procurement teams evaluate restroom paper, the first question is usually about cost per case. But the **second** question — increasingly — is about recycled content. Here's why it matters and how to evaluate it.

## The math is striking

A standard case of virgin bath tissue requires roughly 0.5 mature trees and 350 gallons of water to produce. Switch to 80% recycled content and those numbers drop to 0.1 trees and 130 gallons — **a 4x reduction**.

## What to look for on a spec sheet

- **Post-consumer recycled (PCR) %** — this is the gold standard
- **FSC certification** — ensures chain-of-custody for any virgin fiber
- **Green Seal** — independent third-party verification
- **EPA Safer Choice** — for any chemical processing aids

## How Mino helps

Every product in our catalog lists its sustainability metrics up front. Your account dashboard automatically rolls up your annual impact — trees saved, water saved, plastic avoided — so you can report it to stakeholders.`,
      author: 'Mino Sustainability Team',
      tags: JSON.stringify(['sustainability', 'recycled', 'procurement']),
      coverImage: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=1200&q=80&auto=format&fit=crop',
      publishedAt: new Date(Date.now() - 5 * 86400000),
    },
  })
  await db.blogPost.create({
    data: {
      title: 'The Ojibwe Meaning of "Mino": Doing Things the Good Way',
      slug: 'ojibwe-meaning-of-mino',
      excerpt:
        'How an Indigenous principle of "the good way" shapes our supply chain, partnerships, and product standards.',
      content: `# The Ojibwe Meaning of "Mino"

The word *Mino* (pronounced MIN-oh) comes from the Anishinaabe/Ojibwe language. It translates roughly as **"good"** — but in a deeper sense, it means *doing things in a good way*. A way that honors the land, the community, and the future.

## Why we chose the name

When our founders started sourcing eco-friendly paper products for B2B customers, they wanted a name that captured more than "green" or "eco." They wanted a word that encoded **responsibility** — to forests, to the workers who make the products, and to the businesses we serve.

## The YANUODO partnership

We manufacture our core line with YANUODO, a partner that shares our standards for recycled content, water stewardship, and fair labor. Together we audit every mill in our supply chain annually.

## What "the good way" means in practice

- 80%+ recycled content as a baseline (not an upsell)
- FSC + Green Seal certification on every product
- Net terms and custom pricing for small operators, not just enterprise
- Transparent sustainability reporting for every customer`,
      author: 'Mino Founders',
      tags: JSON.stringify(['story', 'ojibwe', 'values']),
      coverImage: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&q=80&auto=format&fit=crop',
      publishedAt: new Date(Date.now() - 14 * 86400000),
    },
  })
  await db.blogPost.create({
    data: {
      title: 'Cutting Costs Without Cutting Quality: A B2B Paper Buyer Guide',
      slug: 'cutting-costs-without-cutting-quality',
      excerpt:
        'Five procurement strategies that lower your per-case cost without sacrificing softness, absorbency, or sustainability.',
      content: `# Cutting Costs Without Cutting Quality

B2B paper buyers face a constant tension: quality vs. cost. Here are five strategies we recommend to customers every week.

## 1. Right-size your case count

Buying 12-roll cases when you actually need 6-roll cases means higher per-unit cost. The reverse means storage headaches. Audit your actual usage for 30 days, then match the case pack size.

## 2. Negotiate a tiered discount

Most suppliers (including Mino) offer volume tiers. If you commit to a monthly volume, you unlock 5–15% off across the catalog. Ask for it.

## 3. Consolidate SKUs

One restaurant we work with reduced from 14 SKUs to 6 and saved 12% on procurement overhead — plus simplified storage.

## 4. Use order guides

Reordering the same products every week? Save them as an order guide and skip the catalog browsing. Less time, fewer mistakes.

## 5. Track sustainability metrics

It sounds soft, but customers and employees increasingly ask about it. Mino's portal auto-calculates your impact — useful for ESG reporting and marketing.`,
      author: 'Mino Procurement Team',
      tags: JSON.stringify(['procurement', 'cost-savings', 'best-practices']),
      coverImage: 'https://images.unsplash.com/photo-1553413077-190dd305871c?w=1200&q=80&auto=format&fit=crop',
      publishedAt: new Date(Date.now() - 21 * 86400000),
    },
  })

  console.log('✅ Seed complete.')
  console.log('   Demo logins:')
  console.log('   admin@mino.supplies / admin1234  (admin)')
  console.log('')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
