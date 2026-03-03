import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const VALID_STATUSES = ['New', 'In Review', 'Quoted', 'Closed'];

type UpdatePayload = {
  status?: string;
  assignedVendorId?: number | null;
  internalNotes?: string;
};

export default function adminRfqsRouter(prisma: PrismaClient) {
  const router = Router();
  const rfqInclude = Prisma.validator<Prisma.RFQInclude>()({ assignedVendor: true });
  type RfqWithVendor = Prisma.RFQGetPayload<{ include: typeof rfqInclude }>;

  router.get('/', async (_req: Request, res: Response) => {
    const rfqs = await prisma.rFQ.findMany({ orderBy: { createdAt: 'desc' }, include: rfqInclude });
    res.json(
      rfqs.map((rfq: RfqWithVendor) => ({
        id: rfq.id,
        productName: rfq.partNumber ?? 'General Inquiry',
        quantity: 1,
        buyerName: rfq.name,
        buyerCompany: rfq.company ?? 'N/A',
        buyerEmail: rfq.email,
        status: rfq.status,
        assignedVendorId: rfq.assignedVendorId,
        assignedVendorName: rfq.assignedVendor?.name ?? null,
        notes: rfq.internalNotes,
        createdAt: rfq.createdAt,
      })),
    );
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    const rfqId = Number(req.params.id);
    if (Number.isNaN(rfqId)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const payload = req.body as UpdatePayload;
    if (payload.status && !VALID_STATUSES.includes(payload.status)) {
      return res.status(400).json({ error: 'invalid status' });
    }

    const assignedVendorUpdate =
      payload.assignedVendorId === null
        ? { assignedVendorId: null }
        : payload.assignedVendorId !== undefined
        ? { assignedVendorId: Number(payload.assignedVendorId) }
        : {};

    const rfq = await prisma.rFQ.update({
      where: { id: rfqId },
      data: {
        ...(payload.status ? { status: payload.status } : {}),
        ...assignedVendorUpdate,
        internalNotes: payload.internalNotes,
      },
      include: rfqInclude,
    });

    const typedRfq = rfq as RfqWithVendor;

    res.json({
      id: typedRfq.id,
      status: typedRfq.status,
      assignedVendorId: typedRfq.assignedVendorId,
      assignedVendorName: typedRfq.assignedVendor?.name ?? null,
      internalNotes: typedRfq.internalNotes,
    });
  });

  return router;
}
