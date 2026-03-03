import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const STATUSES = ['New', 'In Review', 'Resolved', 'Closed'];

type UpdatePayload = {
  status?: string;
  description?: string;
};

export default function adminComplaintsRouter(prisma: PrismaClient) {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    const complaints = await prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: true, vendor: true },
    });

    res.json(
      complaints.map((complaint) => ({
        id: complaint.id,
        subject: complaint.subject,
        status: complaint.status,
        product: complaint.product.name,
        vendor: complaint.vendor?.name ?? 'Unassigned',
        createdAt: complaint.createdAt,
        updatedAt: complaint.updatedAt,
      })),
    );
  });

  router.patch('/:id', async (req: Request, res: Response) => {
    const complaintId = Number(req.params.id);
    if (Number.isNaN(complaintId)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const payload = req.body as UpdatePayload;
    if (payload.status && !STATUSES.includes(payload.status)) {
      return res.status(400).json({ error: 'invalid status' });
    }

    const complaint = await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        ...(payload.status ? { status: payload.status } : {}),
        ...(payload.description ? { description: payload.description } : {}),
      },
    });

    res.json({ id: complaint.id, status: complaint.status, updatedAt: complaint.updatedAt });
  });

  return router;
}
