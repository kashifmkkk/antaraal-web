import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export default function adminWarrantyRouter(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const records = await prisma.warrantyRecord.findMany({
      orderBy: { expiryDate: 'asc' },
      include: {
        product: true,
        vendor: true,
      },
    });

    const now = new Date();
    const enriched = await Promise.all(
      records.map(async (record) => {
        let computedStatus = record.status;
        const daysLeft = Math.floor((record.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) {
          computedStatus = 'Expired';
        } else if (daysLeft <= 60) {
          computedStatus = 'Expiring';
        } else {
          computedStatus = 'Active';
        }

        if (computedStatus !== record.status) {
          await prisma.warrantyRecord.update({ where: { id: record.id }, data: { status: computedStatus } });
        }

        return {
          id: record.id,
          productName: record.product.name,
          vendor: record.vendor?.name ?? 'Unassigned',
          tailNumber: record.tailNumber,
          expiryDate: record.expiryDate,
          status: computedStatus,
        };
      }),
    );

    res.json(enriched);
  });

  router.post('/:id/refresh', async (req: Request, res: Response) => {
    const recordId = Number(req.params.id);
    if (Number.isNaN(recordId)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const record = await prisma.warrantyRecord.findUnique({ where: { id: recordId } });
    if (!record) {
      return res.status(404).json({ error: 'record not found' });
    }

    // In a real system this would trigger downstream automation. Here we just echo the current state.
    res.json({ id: record.id, status: record.status });
  });

  return router;
}
