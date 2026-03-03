import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export default function notificationsRouter(prisma: PrismaClient) {
  const router = Router();

  // List notifications for current user or vendor
  router.get('/', async (req: any, res: Response) => {
    try {
      const auth = req.auth;
      if (!auth) return res.status(401).json({ error: 'unauthorized' });

      const where: any = {};
      // Admin sees all
      if (auth.role === 'ADMIN') {
        // no filter
      } else if (auth.vendorId) {
        // vendor user: notifications for vendor or for this specific user
        where.OR = [{ vendorId: auth.vendorId }, { userId: auth.userId }];
      } else {
        // plain user
        where.userId = auth.userId;
      }

      const notifications = await prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
      res.json(notifications);
    } catch (e: any) {
      console.error('notifications list error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  // Mark notification as read
  router.patch('/:id/read', async (req: any, res: Response) => {
    try {
      const auth = req.auth;
      if (!auth) return res.status(401).json({ error: 'unauthorized' });
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

      const notif = await prisma.notification.findUnique({ where: { id } });
      if (!notif) return res.status(404).json({ error: 'not found' });

      // ensure user can mark this as read
      if (auth.role !== 'ADMIN') {
        const allowed = (notif.userId && notif.userId === auth.userId) || (notif.vendorId && notif.vendorId === auth.vendorId);
        if (!allowed) return res.status(403).json({ error: 'forbidden' });
      }

      const updated = await prisma.notification.update({ where: { id }, data: { isRead: true } });
      res.json(updated);
    } catch (e: any) {
      console.error('notification read error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  return router;
}
