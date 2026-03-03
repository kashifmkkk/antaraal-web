import { Router, RequestHandler } from 'express';
import { PrismaClient, Prisma, $Enums } from '@prisma/client';
import adminAuthRouter from './auth';
import adminDashboardRouter from './dashboard';
import adminInventoryRouter from './inventory';
import adminVendorsRouter from './vendors';
import adminRfqsRouter from './rfqs';
import adminQuotesRouter from './quotes';
import adminMroRouter from './mro';
import adminWarrantyRouter from './warranty';
import adminComplaintsRouter from './complaints';
import adminUsersRouter from './users';
import adminSettingsRouter from './settings';
import adminOrdersRouter from './orders';
import adminWarrantyClaimsRouter from './warranty-claims';
import adminReviewsRouter from './reviews';
import adminAnalyticsRouter from './analytics';
import adminCategoriesRouter from './categories';
import { requireRole } from '../../middleware/auth';

export default function registerAdminRoutes(prisma: PrismaClient, requireAuth: RequestHandler) {
  const router = Router();
  const Role = $Enums.Role;

  router.use('/auth', adminAuthRouter(prisma, requireAuth));

  const protectedRouter = Router();
  protectedRouter.use(requireAuth, requireRole(Role.ADMIN));
  protectedRouter.use('/dashboard', adminDashboardRouter(prisma));
  protectedRouter.use('/inventory', adminInventoryRouter(prisma));
  protectedRouter.use('/uploads', require('./uploads').default());
  protectedRouter.use('/notifications', require('./notifications').default(prisma));
  protectedRouter.use('/vendors', adminVendorsRouter(prisma));
  protectedRouter.use('/rfqs', adminRfqsRouter(prisma));
  protectedRouter.use('/quotes', adminQuotesRouter(prisma));
  protectedRouter.use('/orders', adminOrdersRouter(prisma));
  protectedRouter.use('/mro', adminMroRouter(prisma));
  protectedRouter.use('/warranty', adminWarrantyRouter(prisma));
  protectedRouter.use('/warranty-claims', adminWarrantyClaimsRouter(prisma));
  protectedRouter.use('/complaints', adminComplaintsRouter(prisma));
  protectedRouter.use('/users', adminUsersRouter(prisma));
  protectedRouter.use('/reviews', adminReviewsRouter(prisma));
  protectedRouter.use('/analytics', adminAnalyticsRouter(prisma));
  protectedRouter.use('/categories', adminCategoriesRouter(prisma));
  protectedRouter.use('/settings', adminSettingsRouter(prisma));
  // Admin: approve vendor-submitted product
  protectedRouter.patch('/products/:id/approve', async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

    const product = await prisma.product.update({ where: { id }, data: { status: 'available', availability: 'Available' } });
    // Create notifications for vendor users when product is approved
    try {
      if (product.vendor) {
        const vendor = await prisma.vendor.findUnique({ where: { name: product.vendor } });
        if (vendor) {
          // notify all users belonging to vendor
          const users = await prisma.user.findMany({ where: { vendorId: vendor.id } });
          const title = `Product approved: ${product.name}`;
          const body = `Your product "${product.name}" was approved and is now available.`;
          for (const u of users) {
            await prisma.notification.create({ data: { title, body, userId: u.id, vendorId: vendor.id, productId: product.id } });
          }
        }
      }
    } catch (e) {
      console.warn('failed to create approval notifications', e);
    }

    res.json({ id: product.id, status: product.status });
  });

  router.use(protectedRouter);

  return router;
}
