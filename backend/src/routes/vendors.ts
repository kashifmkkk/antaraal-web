import { PrismaClient, Prisma, $Enums } from '@prisma/client';
import { Router } from 'express';
import { requireRole } from '../middleware/auth';

export default function vendorsRouter(prisma: PrismaClient) {
  const router = Router();
  const Role = $Enums.Role;

  router.get('/', requireRole(Role.ADMIN, Role.BUYER, Role.VENDOR), async (req, res) => {
    const auth = req.auth;
    if (!auth) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (auth.role === Role.VENDOR) {
      if (!auth.vendorId) {
        return res.json([]);
      }
      const vendor = await prisma.vendor.findUnique({ where: { id: auth.vendorId } });
      return res.json(vendor ? [vendor] : []);
    }

    const vendors = await prisma.vendor.findMany({ orderBy: { id: 'asc' } });
    res.json(vendors);
  });

  router.get('/:id', requireRole(Role.ADMIN, Role.BUYER, Role.VENDOR), async (req, res) => {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }

    const auth = req.auth;
    if (!auth) {
      return res.status(401).json({ error: 'unauthorized' });
    }

    if (auth.role === Role.VENDOR && auth.vendorId !== id) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return res.status(404).json({ error: 'not found' });
    }

    res.json(vendor);
  });

  return router;
}
