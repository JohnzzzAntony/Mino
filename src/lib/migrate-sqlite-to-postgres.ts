// Migration script: SQLite to PostgreSQL
// Run with: bun run src/lib/migrate-sqlite-to-postgres.ts
import { Database } from 'bun:sqlite';
import { PrismaClient } from '@prisma/client';

const sqliteDb = new Database('db/custom.db');
const prisma = new PrismaClient();

async function main() {
  console.log('🏁 Starting data migration from SQLite to PostgreSQL...');

  // 1. PricingTier
  console.log('Migrating PricingTier...');
  const tiers = sqliteDb.query('SELECT * FROM PricingTier').all() as any[];
  for (const row of tiers) {
    await prisma.pricingTier.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        name: row.name,
        discountPercent: Number(row.discountPercent),
      },
    });
  }
  console.log(`   Migrated ${tiers.length} PricingTier rows.`);

  // 2. Company
  console.log('Migrating Company...');
  const companies = sqliteDb.query('SELECT * FROM Company').all() as any[];
  for (const row of companies) {
    await prisma.company.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        name: row.name,
        status: row.status,
        pricingTierId: row.pricingTierId,
        netTermsDays: Number(row.netTermsDays),
        approvalThreshold: Number(row.approvalThreshold),
        businessType: row.businessType,
        monthlyVolume: row.monthlyVolume,
        createdAt: new Date(row.createdAt),
      },
    });
  }
  console.log(`   Migrated ${companies.length} Company rows.`);

  // 3. User
  console.log('Migrating User...');
  const users = sqliteDb.query('SELECT * FROM User').all() as any[];
  for (const row of users) {
    await prisma.user.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        email: row.email,
        name: row.name,
        password: row.password,
        role: row.role,
        companyId: row.companyId,
        createdAt: new Date(row.createdAt),
      },
    });
  }
  console.log(`   Migrated ${users.length} User rows.`);

  // 4. Address
  console.log('Migrating Address...');
  const addresses = sqliteDb.query('SELECT * FROM Address').all() as any[];
  for (const row of addresses) {
    await prisma.address.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        companyId: row.companyId,
        label: row.label,
        line1: row.line1,
        line2: row.line2,
        city: row.city,
        state: row.state,
        zip: row.zip,
        type: row.type,
      },
    });
  }
  console.log(`   Migrated ${addresses.length} Address rows.`);

  // 5. Category
  console.log('Migrating Category...');
  const categories = sqliteDb.query('SELECT * FROM Category').all() as any[];
  for (const row of categories) {
    await prisma.category.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        name: row.name,
        slug: row.slug,
        parentId: row.parentId,
        icon: row.icon,
        blurb: row.blurb,
      },
    });
  }
  console.log(`   Migrated ${categories.length} Category rows.`);

  // 6. Product
  console.log('Migrating Product...');
  const products = sqliteDb.query('SELECT * FROM Product').all() as any[];
  for (const row of products) {
    await prisma.product.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        sku: row.sku,
        name: row.name,
        slug: row.slug,
        categoryId: row.categoryId,
        description: row.description,
        specs: row.specs,
        certifications: row.certifications,
        application: row.application,
        unit: row.unit,
        casePackSize: Number(row.casePackSize),
        basePrice: Number(row.basePrice),
        images: row.images,
        sustainabilityMetrics: row.sustainabilityMetrics,
        sdsUrl: row.sdsUrl,
        techSheetUrl: row.techSheetUrl,
        status: row.status,
        bestSeller: row.bestSeller === 1 || row.bestSeller === true,
        rating: Number(row.rating),
        createdAt: new Date(row.createdAt),
      },
    });
  }
  console.log(`   Migrated ${products.length} Product rows.`);

  // 7. ProductPriceOverride
  console.log('Migrating ProductPriceOverride...');
  const overrides = sqliteDb.query('SELECT * FROM ProductPriceOverride').all() as any[];
  for (const row of overrides) {
    await prisma.productPriceOverride.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        companyId: row.companyId,
        productId: row.productId,
        price: Number(row.price),
      },
    });
  }
  console.log(`   Migrated ${overrides.length} ProductPriceOverride rows.`);

  // 8. Order
  console.log('Migrating Order...');
  const orders = sqliteDb.query('SELECT * FROM "Order"').all() as any[];
  for (const row of orders) {
    await prisma.order.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        companyId: row.companyId,
        userId: row.userId,
        poNumber: row.poNumber,
        status: row.status,
        deliveryDate: row.deliveryDate ? new Date(row.deliveryDate) : null,
        shippingAddressId: row.shippingAddressId,
        shippingAddressJson: row.shippingAddressJson,
        subtotal: Number(row.subtotal),
        total: Number(row.total),
        sustainabilitySummary: row.sustainabilitySummary,
        carrier: row.carrier,
        trackingNumber: row.trackingNumber,
        notes: row.notes,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      },
    });
  }
  console.log(`   Migrated ${orders.length} Order rows.`);

  // 9. OrderItem
  console.log('Migrating OrderItem...');
  const orderItems = sqliteDb.query('SELECT * FROM OrderItem').all() as any[];
  for (const row of orderItems) {
    await prisma.orderItem.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        orderId: row.orderId,
        productId: row.productId,
        productName: row.productName,
        sku: row.sku,
        quantity: Number(row.quantity),
        unitPrice: Number(row.unitPrice),
      },
    });
  }
  console.log(`   Migrated ${orderItems.length} OrderItem rows.`);

  // 10. ApprovalRequest
  console.log('Migrating ApprovalRequest...');
  const approvals = sqliteDb.query('SELECT * FROM ApprovalRequest').all() as any[];
  for (const row of approvals) {
    await prisma.approvalRequest.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        orderId: row.orderId,
        requestedBy: row.requestedBy,
        approverId: row.approverId,
        status: row.status,
        notes: row.notes,
        createdAt: new Date(row.createdAt),
        resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : null,
      },
    });
  }
  console.log(`   Migrated ${approvals.length} ApprovalRequest rows.`);

  // 11. Invoice
  console.log('Migrating Invoice...');
  const invoices = sqliteDb.query('SELECT * FROM Invoice').all() as any[];
  for (const row of invoices) {
    await prisma.invoice.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        companyId: row.companyId,
        orderId: row.orderId,
        invoiceNumber: row.invoiceNumber,
        amount: Number(row.amount),
        dueDate: new Date(row.dueDate),
        status: row.status,
        pdfUrl: row.pdfUrl,
        createdAt: new Date(row.createdAt),
        paidAt: row.paidAt ? new Date(row.paidAt) : null,
      },
    });
  }
  console.log(`   Migrated ${invoices.length} Invoice rows.`);

  // 12. OrderGuide
  console.log('Migrating OrderGuide...');
  const guides = sqliteDb.query('SELECT * FROM OrderGuide').all() as any[];
  for (const row of guides) {
    await prisma.orderGuide.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        companyId: row.companyId,
        userId: row.userId,
        name: row.name,
        items: row.items,
        createdAt: new Date(row.createdAt),
      },
    });
  }
  console.log(`   Migrated ${guides.length} OrderGuide rows.`);

  // 13. WholesaleLead
  console.log('Migrating WholesaleLead...');
  const leads = sqliteDb.query('SELECT * FROM WholesaleLead').all() as any[];
  for (const row of leads) {
    await prisma.wholesaleLead.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        companyName: row.companyName,
        contactName: row.contactName,
        email: row.email,
        phone: row.phone,
        businessType: row.businessType,
        monthlyVolume: row.monthlyVolume,
        message: row.message,
        status: row.status,
        createdAt: new Date(row.createdAt),
      },
    });
  }
  console.log(`   Migrated ${leads.length} WholesaleLead rows.`);

  // 14. BlogPost
  console.log('Migrating BlogPost...');
  const posts = sqliteDb.query('SELECT * FROM BlogPost').all() as any[];
  for (const row of posts) {
    await prisma.blogPost.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        title: row.title,
        slug: row.slug,
        excerpt: row.excerpt,
        content: row.content,
        author: row.author,
        tags: row.tags,
        coverImage: row.coverImage,
        publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
        createdAt: new Date(row.createdAt),
      },
    });
  }
  console.log(`   Migrated ${posts.length} BlogPost rows.`);

  // 15. NewsletterSignup
  console.log('Migrating NewsletterSignup...');
  const signups = sqliteDb.query('SELECT * FROM NewsletterSignup').all() as any[];
  for (const row of signups) {
    await prisma.newsletterSignup.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        email: row.email,
        createdAt: new Date(row.createdAt),
      },
    });
  }
  console.log(`   Migrated ${signups.length} NewsletterSignup rows.`);

  // 16. ContactMessage
  console.log('Migrating ContactMessage...');
  const messages = sqliteDb.query('SELECT * FROM ContactMessage').all() as any[];
  for (const row of messages) {
    await prisma.contactMessage.upsert({
      where: { id: row.id },
      update: {},
      create: {
        id: row.id,
        name: row.name,
        email: row.email,
        subject: row.subject,
        message: row.message,
        createdAt: new Date(row.createdAt),
      },
    });
  }
  console.log(`   Migrated ${messages.length} ContactMessage rows.`);

  console.log('🎉 Data migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    sqliteDb.close();
    await prisma.$disconnect();
  });
