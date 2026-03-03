import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const STATUSES = ['Scheduled', 'In Progress', 'Awaiting Approval', 'Released'];

export default function adminMroRouter(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const orders = await prisma.mroOrder.findMany({ orderBy: { startDate: 'desc' } });
    res.json(orders);
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    const orderId = Number(req.params.id);
    if (Number.isNaN(orderId)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const { status } = req.body as { status?: string };
    if (!status || !STATUSES.includes(status)) {
      return res.status(400).json({ error: 'invalid status' });
    }

    const order = await prisma.mroOrder.update({ where: { id: orderId }, data: { status } });
    res.json(order);
  });

  return router;
}
