import { PrismaClient, Prisma, $Enums } from '@prisma/client';
import { Router } from 'express';
import { requireRole } from '../middleware/auth';

export default function quotesRouter(prisma: PrismaClient) {
  const router = Router();
  const Role = $Enums.Role;
  const quoteInclude = Prisma.validator<Prisma.QuoteInclude>()({ vendor: true, user: true, rfq: true });

  router.post('/', requireRole(Role.VENDOR, Role.ADMIN), async (req, res) => {
    const auth = req.auth;
    const userId = auth?.userId;
    const { rfqId, amount, comments } = req.body;
    if (!rfqId || !amount) return res.status(400).json({ error: 'rfqId and amount required' });

    if (auth?.role === Role.VENDOR) {
      if (!auth.vendorId) {
        return res.status(403).json({ error: 'vendor profile missing' });
      }
      const rfq = await prisma.rFQ.findUnique({
        where: { id: Number(rfqId) },
        select: { assignedVendorId: true },
      });
      if (!rfq) {
        return res.status(404).json({ error: 'rfq not found' });
      }
      if (rfq.assignedVendorId && rfq.assignedVendorId !== auth.vendorId) {
        return res.status(403).json({ error: 'rfq not assigned to vendor' });
      }
    }

    const data: any = { rfqId: Number(rfqId), amount: Number(amount), comments };
    if (userId) data.userId = userId;
    if (auth?.role === Role.VENDOR && auth.vendorId) {
      data.vendorId = auth.vendorId;
    }

    const quote = await prisma.quote.create({ data });
    res.status(201).json(quote);
  });

  router.get('/', requireRole(Role.ADMIN), async (req, res) => {
    const { rfqId } = req.query;
    const where = rfqId ? { where: { rfqId: Number(rfqId) } } : {};
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      ...(where as any),
      include: quoteInclude,
    });
    res.json(quotes);
  });

  router.get('/my', requireRole(Role.VENDOR, Role.ADMIN), async (req, res) => {
    const auth = req.auth;
    if (!auth?.userId) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    const where = auth.role === Role.ADMIN ? {} : { userId: auth.userId };
    const quotes = await prisma.quote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: quoteInclude,
    });
    res.json(quotes);
  });

  return router;
}
