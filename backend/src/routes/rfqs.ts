import { PrismaClient, Prisma, $Enums } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { requireRole } from '../middleware/auth';

export default function rfqRouter(prisma: PrismaClient) {
  const router = Router();
  const Role = $Enums.Role;

  router.post('/', requireRole(Role.BUYER, Role.ADMIN), async (req: Request, res: Response) => {
    const { name, company, email, phone, partNumber, message, fileUrl } = req.body as {
      name?: string;
      company?: string;
      email?: string;
      phone?: string;
      partNumber?: string;
      message?: string;
      fileUrl?: string;
    };
    if (!name || !email) return res.status(400).json({ error: 'name and email required' });

    const rfq = await prisma.rFQ.create({
      data: {
        name,
        company,
        email,
        phone,
        partNumber,
        message,
        fileUrl,
        buyerId: req.auth?.role === Role.BUYER ? req.auth.userId : null,
      },
    });

    res.status(201).json(rfq);
  });

  router.get('/', requireRole(Role.ADMIN, Role.BUYER, Role.VENDOR), async (req: Request, res: Response) => {
    const auth = req.auth;
    if (!auth) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    let where: Prisma.RFQWhereInput = {};
    if (auth.role === Role.BUYER) {
      where = { buyerId: auth.userId };
    } else if (auth.role === Role.VENDOR) {
      if (!auth.vendorId) {
        return res.json([]);
      }
      where = { assignedVendorId: auth.vendorId };
    }

    const rfqs = await prisma.rFQ.findMany({ orderBy: { createdAt: 'desc' }, where });
    res.json(rfqs);
  });

  return router;
}
