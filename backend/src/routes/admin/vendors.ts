import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const ALLOWED_STATUSES = ['Verified', 'Pending', 'Rejected'];

export default function adminVendorsRouter(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const vendors = await prisma.vendor.findMany({ orderBy: { name: 'asc' } });
    res.json(
      vendors.map((vendor) => ({
        id: vendor.id,
        name: vendor.name,
        location: vendor.location ?? 'Unspecified',
        specialty: vendor.specialty ?? 'General',
        verificationStatus: vendor.verificationStatus,
        isActive: vendor.isActive,
      })),
    );
  });

  router.patch('/:id/verification', async (req: Request, res: Response) => {
    const vendorId = Number(req.params.id);
    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const { status } = req.body as { status?: string };
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'invalid status' });
    }

    const vendor = await prisma.vendor.update({ where: { id: vendorId }, data: { verificationStatus: status } });
    res.json({ id: vendor.id, verificationStatus: vendor.verificationStatus });
  });

  router.patch('/:id/status', async (req: Request, res: Response) => {
    const vendorId = Number(req.params.id);
    if (Number.isNaN(vendorId)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const { isActive } = req.body as { isActive?: boolean };
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive required' });
    }

    const vendor = await prisma.vendor.update({ where: { id: vendorId }, data: { isActive } });
    res.json({ id: vendor.id, isActive: vendor.isActive });
  });

  return router;
}
