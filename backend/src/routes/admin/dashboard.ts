import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export default function adminDashboardRouter(prisma: PrismaClient) {
  const router = Router();

  router.get('/kpis', async (_req: Request, res: Response) => {
    const [totalProducts, activeVendors, openRfqs, pendingComplaints] = await prisma.$transaction([
      prisma.product.count(),
      prisma.vendor.count({ where: { isActive: true } }),
      prisma.rFQ.count({ where: { status: { in: ['New', 'In Review'] } } }),
      prisma.complaint.count({ where: { status: { not: 'Closed' } } }),
    ]);

    res.json({ totalProducts, activeVendors, openRfqs, pendingComplaints });
  });

  return router;
}
