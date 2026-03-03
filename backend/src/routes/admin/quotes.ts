import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const STATUSES = ['Draft', 'Sent', 'Accepted', 'Declined'];

export default function adminQuotesRouter(prisma: PrismaClient) {
  const router = Router();
  const quoteInclude = Prisma.validator<Prisma.QuoteInclude>()({ user: true, vendor: true, rfq: true });
  type QuoteWithRelations = Prisma.QuoteGetPayload<{ include: typeof quoteInclude }>;

  router.get('/', async (_req: Request, res: Response) => {
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      include: quoteInclude,
    });
    res.json(
      quotes.map((quote: QuoteWithRelations) => ({
        id: quote.id,
        rfqId: quote.rfqId,
        vendor: quote.vendor?.name ?? quote.user?.name ?? 'Unassigned',
        totalValue: quote.amount,
        currency: quote.currency,
        status: quote.status,
        issuedAt: quote.issuedAt,
        validUntil: quote.validUntil,
      })),
    );
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    const quoteId = Number(req.params.id);
    if (Number.isNaN(quoteId)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const { status } = req.body as { status?: string };
    if (!status || !STATUSES.includes(status)) {
      return res.status(400).json({ error: 'invalid status' });
    }

    const quote = await prisma.quote.update({ where: { id: quoteId }, data: { status } });
    res.json({ id: quote.id, status: quote.status });
  });

  return router;
}
