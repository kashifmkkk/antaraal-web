import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export default function adminNotificationsRouter(prisma: PrismaClient) {
  const router = Router();

  // Create notification: POST /api/admin/notifications
  router.post('/', async (req: Request, res: Response) => {
    try {
      const { title, body, recipientType, recipientIds, productId } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'title is required' });
      }

      if (!recipientType || !['user', 'vendor', 'all_users', 'all_vendors'].includes(recipientType)) {
        return res.status(400).json({ error: 'recipientType must be user, vendor, all_users, or all_vendors' });
      }

      const notifications: any[] = [];

      if (recipientType === 'all_users') {
        // Send to all users
        const users = await prisma.user.findMany({ select: { id: true } });
        for (const user of users) {
          const notif = await prisma.notification.create({
            data: {
              title,
              body: body || null,
              userId: user.id,
              productId: productId || null,
            },
          });
          notifications.push(notif);
        }
      } else if (recipientType === 'all_vendors') {
        // Send to all vendors
        const vendors = await prisma.vendor.findMany({ select: { id: true } });
        for (const vendor of vendors) {
          const notif = await prisma.notification.create({
            data: {
              title,
              body: body || null,
              vendorId: vendor.id,
              productId: productId || null,
            },
          });
          notifications.push(notif);
        }
      } else if (recipientType === 'user' && recipientIds && Array.isArray(recipientIds)) {
        // Send to specific users
        for (const userId of recipientIds) {
          const notif = await prisma.notification.create({
            data: {
              title,
              body: body || null,
              userId: Number(userId),
              productId: productId || null,
            },
          });
          notifications.push(notif);
        }
      } else if (recipientType === 'vendor' && recipientIds && Array.isArray(recipientIds)) {
        // Send to specific vendors
        for (const vendorId of recipientIds) {
          const notif = await prisma.notification.create({
            data: {
              title,
              body: body || null,
              vendorId: Number(vendorId),
              productId: productId || null,
            },
          });
          notifications.push(notif);
        }
      } else {
        return res.status(400).json({ error: 'recipientIds array is required for user/vendor recipientType' });
      }

      res.json({ success: true, count: notifications.length, notifications });
    } catch (e: any) {
      console.error('notification create error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  // Admin polling endpoint: GET /api/admin/notifications?since=ISO_DATE
  router.get('/', async (req: Request, res: Response) => {
    try {
      const since = req.query.since as string | undefined;
      const where: any = {};
      
      if (since) {
        try {
          const sinceDate = new Date(since);
          where.createdAt = { gt: sinceDate };
        } catch (e) {
          // invalid date, ignore
        }
      }

      // Admin sees all notifications; optionally filter by since date
      const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
      });

      res.json(notifications);
    } catch (e: any) {
      console.error('admin notifications list error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  // Admin SSE endpoint: GET /api/admin/notifications/stream?token=...
  router.get('/stream', async (req: Request, res: Response) => {
    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Send a comment every 15 seconds to keep connection alive
    const keepAlive = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);

    // Poll database every 5 seconds for new notifications
    let lastCheck = new Date();
    const pollInterval = setInterval(async () => {
      try {
        const notifications = await prisma.notification.findMany({
          where: { createdAt: { gt: lastCheck } },
          orderBy: { createdAt: 'asc' },
          take: 20,
        });

        for (const notif of notifications) {
          const payload = {
            id: notif.id.toString(),
            title: notif.title,
            body: notif.body ?? '',
            level: 'info',
            createdAt: notif.createdAt.toISOString(),
          };
          res.write(`data: ${JSON.stringify(payload)}\n\n`);
          lastCheck = notif.createdAt;
        }
      } catch (e) {
        console.error('SSE poll error', e);
      }
    }, 5000);

    // Cleanup on client disconnect
    req.on('close', () => {
      clearInterval(keepAlive);
      clearInterval(pollInterval);
      res.end();
    });
  });

  // Mark notification as read
  router.patch('/:id/read', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

      const notif = await prisma.notification.findUnique({ where: { id } });
      if (!notif) return res.status(404).json({ error: 'not found' });

      const updated = await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });
      res.json(updated);
    } catch (e: any) {
      console.error('notification read error', e);
      res.status(500).json({ error: e?.message ?? 'server error' });
    }
  });

  return router;
}
